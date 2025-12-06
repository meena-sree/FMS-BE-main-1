// controllers/dashboardController.js
import Student from "../models/Student.js";
import StudentLead from "../models/StudentLead.js";
import mongoose from "mongoose";

export const getFranchiseDashboard = async (req, res) => {
  try {
    const { franchiseId } = req.user.franchiseId;

    // Validate franchiseId
    // if (!mongoose.Types.ObjectId.isValid(franchiseId)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Invalid franchise ID",
    //   });
    // }

    // Get current date for calculations
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // ==================== 1. STUDENT LEADS DATA ====================
    const studentLeads = await StudentLead.find({ franchiseId });
    console.log(studentLeads);

    // Lead statistics
    const leadStats = {
      total: studentLeads.length,
      new: studentLeads.filter((lead) => lead.status === "New").length,
      converted: studentLeads.filter((lead) => lead.status === "Converted")
        .length,
      rejected: studentLeads.filter((lead) => lead.status === "Rejected")
        .length,
      conversionRate:
        studentLeads.length > 0
          ? Math.round(
              (studentLeads.filter((lead) => lead.status === "Converted")
                .length /
                studentLeads.length) *
                100
            )
          : 0,
    };

    // Recent leads (last 10)
    const recentLeads = studentLeads
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map((lead) => ({
        id: lead._id,
        name: lead.name,
        phone: lead.contact.phone,
        course: lead.course,
        status: lead.status,
        createdAt: lead.createdAt,
        daysAgo: Math.floor(
          (today - new Date(lead.createdAt)) / (1000 * 60 * 60 * 24)
        ),
      }));

    // Leads by status
    const leadsByStatus = [
      { status: "New", count: leadStats.new, color: "#3B82F6" },
      { status: "Converted", count: leadStats.converted, color: "#10B981" },
      { status: "Rejected", count: leadStats.rejected, color: "#EF4444" },
    ];

    // ==================== 2. STUDENTS DATA ====================
    const students = await Student.find({ FranchiseId: franchiseId });

    // Student statistics
    const studentStats = {
      total: students.length,
      active: students.filter((student) => {
        const payment = student.payment[0];
        if (!payment) return false;
        const totalPaid = payment.paidHistory.reduce(
          (sum, history) => sum + history.paidAmount,
          0
        );
        return totalPaid > 0 && totalPaid < payment.finalFee;
      }).length,
      completed: students.filter((student) => {
        const payment = student.payment[0];
        if (!payment) return false;
        const totalPaid = payment.paidHistory.reduce(
          (sum, history) => sum + history.paidAmount,
          0
        );
        return totalPaid >= payment.finalFee;
      }).length,
      pendingPayment: students.filter((student) => {
        const payment = student.payment[0];
        if (!payment) return false;
        const totalPaid = payment.paidHistory.reduce(
          (sum, history) => sum + history.paidAmount,
          0
        );
        return totalPaid === 0;
      }).length,
    };

    // Recent students (last 10)
    const recentStudents = students
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map((student) => {
        const payment = student.payment[0];
        const totalPaid = payment
          ? payment.paidHistory.reduce(
              (sum, history) => sum + history.paidAmount,
              0
            )
          : 0;
        const finalFee = payment ? payment.finalFee : 0;
        const progress =
          finalFee > 0 ? Math.round((totalPaid / finalFee) * 100) : 0;

        return {
          id: student._id,
          name: student.name,
          phone: student.phone,
          course: student.courses[0]?.name || "N/A",
          totalPaid: totalPaid,
          finalFee: finalFee,
          progress: progress,
          createdAt: student.createdAt,
        };
      });

    // ==================== 3. FINANCIAL DATA ====================
    let totalRevenue = 0;
    let totalPending = 0;
    let monthlyRevenue = 0;
    let revenueTrend = 0;
    const paymentMethods = { UPI: 0, Cash: 0, "Bank Transfer": 0, Online: 0 };

    // Process all students for financial data
    students.forEach((student) => {
      const payment = student.payment[0];
      if (payment) {
        // Total revenue (all paid amounts)
        const totalPaid = payment.paidHistory.reduce(
          (sum, history) => sum + history.paidAmount,
          0
        );
        totalRevenue += totalPaid;

        // Total pending (final fee - paid amount)
        totalPending += payment.finalFee - totalPaid;

        // Monthly revenue (payments in current month)
        const monthlyPaid = payment.paidHistory
          .filter(
            (history) =>
              new Date(history.paidDate) >= startOfMonth &&
              new Date(history.paidDate) <= endOfMonth
          )
          .reduce((sum, history) => sum + history.paidAmount, 0);
        monthlyRevenue += monthlyPaid;

        // Payment methods breakdown
        payment.paidHistory.forEach((history) => {
          if (paymentMethods[history.method] !== undefined) {
            paymentMethods[history.method] += history.paidAmount;
          }
        });
      }
    });

    // Revenue trend (compare with previous month)
    const previousMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const previousMonthEnd = new Date(currentYear, currentMonth, 0);
    let previousMonthRevenue = 0;

    students.forEach((student) => {
      const payment = student.payment[0];
      if (payment) {
        const previousPaid = payment.paidHistory
          .filter(
            (history) =>
              new Date(history.paidDate) >= previousMonthStart &&
              new Date(history.paidDate) <= previousMonthEnd
          )
          .reduce((sum, history) => sum + history.paidAmount, 0);
        previousMonthRevenue += previousPaid;
      }
    });

    revenueTrend =
      previousMonthRevenue > 0
        ? Math.round(
            ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) *
              100
          )
        : 0;

    // Format payment methods for chart
    const paymentMethodData = Object.entries(paymentMethods)
      .filter(([_, amount]) => amount > 0)
      .map(([method, amount]) => ({
        method,
        amount,
        percentage:
          totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0,
      }));

    // ==================== 4. INSTALLMENT DATA ====================
    const allInstallments = [];
    const overdueInstallments = [];
    const upcomingInstallments = [];

    students.forEach((student) => {
      const payment = student.payment[0];
      if (payment) {
        payment.installments.forEach((installment) => {
          const installmentData = {
            studentId: student._id,
            studentName: student.name,
            installmentNo: installment.installmentNo,
            dueDate: installment.dueDate,
            amount: installment.totalPayable,
            status: installment.status,
            paidAmount: installment.paidAmount,
            isOverdue:
              installment.status === "pending" &&
              new Date(installment.dueDate) < today,
          };

          allInstallments.push(installmentData);

          if (installmentData.isOverdue) {
            overdueInstallments.push(installmentData);
          }

          if (
            installment.status === "pending" &&
            new Date(installment.dueDate) >= today
          ) {
            upcomingInstallments.push(installmentData);
          }
        });
      }
    });

    // Sort installments by due date
    overdueInstallments.sort(
      (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
    );
    upcomingInstallments.sort(
      (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
    );

    // ==================== 5. COURSE ANALYTICS ====================
    const courseAnalytics = {};

    // Analyze by course from students
    students.forEach((student) => {
      const courseName = student.courses[0]?.name || "Unknown";
      const payment = student.payment[0];
      const totalPaid = payment
        ? payment.paidHistory.reduce(
            (sum, history) => sum + history.paidAmount,
            0
          )
        : 0;

      if (!courseAnalytics[courseName]) {
        courseAnalytics[courseName] = {
          name: courseName,
          totalStudents: 0,
          totalRevenue: 0,
          avgRevenue: 0,
        };
      }

      courseAnalytics[courseName].totalStudents++;
      courseAnalytics[courseName].totalRevenue += totalPaid;
    });

    // Calculate averages
    Object.keys(courseAnalytics).forEach((course) => {
      courseAnalytics[course].avgRevenue = Math.round(
        courseAnalytics[course].totalRevenue /
          courseAnalytics[course].totalStudents
      );
    });

    const courseData = Object.values(courseAnalytics);

    // ==================== 6. MONTHLY REVENUE TREND (Last 6 months) ====================
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(currentYear, currentMonth - i, 1);
      const monthStart = new Date(currentYear, currentMonth - i, 1);
      const monthEnd = new Date(currentYear, currentMonth - i + 1, 0);
      const monthName = month.toLocaleString("default", { month: "short" });

      let monthRevenue = 0;
      students.forEach((student) => {
        const payment = student.payment[0];
        if (payment) {
          const monthPaid = payment.paidHistory
            .filter(
              (history) =>
                new Date(history.paidDate) >= monthStart &&
                new Date(history.paidDate) <= monthEnd
            )
            .reduce((sum, history) => sum + history.paidAmount, 0);
          monthRevenue += monthPaid;
        }
      });

      monthlyTrend.push({
        month: monthName,
        revenue: monthRevenue,
      });
    }

    // ==================== 7. PERFORMANCE METRICS ====================
    const performanceMetrics = {
      leadConversionRate: leadStats.conversionRate,
      studentRetentionRate:
        students.length > 0
          ? Math.round(
              ((students.length - studentStats.pendingPayment) /
                students.length) *
                100
            )
          : 0,
      averagePaymentCompletion:
        students.length > 0
          ? Math.round(
              students.reduce((sum, student) => {
                const payment = student.payment[0];
                if (!payment) return sum;
                const totalPaid = payment.paidHistory.reduce(
                  (s, h) => s + h.paidAmount,
                  0
                );
                return sum + (totalPaid / payment.finalFee) * 100;
              }, 0) / students.length
            )
          : 0,
      revenuePerStudent:
        students.length > 0 ? Math.round(totalRevenue / students.length) : 0,
    };

    // ==================== 8. QUICK STATS ====================
    const quickStats = [
      {
        title: "Total Students",
        value: studentStats.total,
        icon: "👥",
        change: "+12%",
        color: "blue",
      },
      {
        title: "Total Revenue",
        value: `₹${totalRevenue.toLocaleString("en-IN")}`,
        icon: "💰",
        change: revenueTrend > 0 ? `+${revenueTrend}%` : `${revenueTrend}%`,
        color: "green",
      },
      {
        title: "Pending Payments",
        value: `₹${totalPending.toLocaleString("en-IN")}`,
        icon: "⏳",
        change:
          overdueInstallments.length > 0
            ? `${overdueInstallments.length} overdue`
            : "All clear",
        color: "orange",
      },
      {
        title: "Lead Conversion",
        value: `${leadStats.conversionRate}%`,
        icon: "📈",
        change:
          leadStats.converted > 0
            ? `${leadStats.converted} converted`
            : "No conversions",
        color: "purple",
      },
    ];

    // ==================== 9. RECENT ACTIVITY ====================
    const recentActivity = [];

    // Add lead conversions
    studentLeads
      .filter((lead) => lead.status === "Converted")
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
      .forEach((lead) => {
        recentActivity.push({
          type: "lead_converted",
          title: "Lead Converted to Student",
          description: `${lead.name} converted from lead to student`,
          timestamp: lead.updatedAt,
          icon: "✅",
        });
      });

    // Add recent payments
    students.forEach((student) => {
      const payment = student.payment[0];
      if (payment) {
        payment.paidHistory
          .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
          .slice(0, 2)
          .forEach((history) => {
            recentActivity.push({
              type: "payment_received",
              title: "Payment Received",
              description: `₹${history.paidAmount} from ${student.name} for Installment #${history.installmentNo}`,
              timestamp: history.paidDate,
              icon: "💳",
            });
          });
      }
    });

    // Sort by timestamp and limit to 10
    recentActivity
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    // ==================== FINAL RESPONSE ====================
    const dashboardData = {
      success: true,
      data: {
        // Quick Overview
        quickStats,

        // Lead Management
        leadManagement: {
          stats: leadStats,
          leadsByStatus,
          recentLeads,
          conversionRate: leadStats.conversionRate,
        },

        // Student Management
        studentManagement: {
          stats: studentStats,
          recentStudents,
          totalStudents: studentStats.total,
        },

        // Financial Overview
        financials: {
          totalRevenue,
          totalPending,
          monthlyRevenue,
          revenueTrend,
          paymentMethods: paymentMethodData,
          monthlyTrend,
        },

        // Installments
        installments: {
          total: allInstallments.length,
          overdue: overdueInstallments.length,
          upcoming: upcomingInstallments.length,
          overdueInstallments: overdueInstallments.slice(0, 5),
          upcomingInstallments: upcomingInstallments.slice(0, 5),
        },

        // Analytics
        analytics: {
          courseData,
          performanceMetrics,
        },

        // Recent Activity
        recentActivity,

        // Timestamps
        generatedAt: new Date().toISOString(),
        timeRange: {
          currentMonth: today.toLocaleString("default", {
            month: "long",
            year: "numeric",
          }),
          startDate: startOfMonth,
          endDate: endOfMonth,
        },
      },
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Error fetching franchise dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
      error: error.message,
    });
  }
};

// Optional: Get detailed student analytics
export const getStudentAnalytics = async (req, res) => {
  try {
    const { franchiseId } = req.user.franchiseId;

    const students = await Student.find({ FranchiseId: franchiseId })
      .populate("ManagerId", "name email")
      .sort({ createdAt: -1 });

    const analytics = students.map((student) => {
      const payment = student.payment[0];
      const totalPaid = payment
        ? payment.paidHistory.reduce(
            (sum, history) => sum + history.paidAmount,
            0
          )
        : 0;
      const finalFee = payment ? payment.finalFee : 0;
      const progress =
        finalFee > 0 ? Math.round((totalPaid / finalFee) * 100) : 0;

      return {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        course: student.courses[0]?.name || "N/A",
        enrollmentDate: student.createdAt,
        manager: student.ManagerId?.name || "N/A",
        totalFee: finalFee,
        paidAmount: totalPaid,
        pendingAmount: finalFee - totalPaid,
        progress: progress,
        status:
          progress === 100
            ? "Completed"
            : progress > 0
            ? "In Progress"
            : "Not Started",
        installments: payment
          ? {
              total: payment.installments.length,
              paid: payment.installments.filter(
                (inst) => inst.status === "paid"
              ).length,
              pending: payment.installments.filter(
                (inst) => inst.status === "pending"
              ).length,
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching student analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching student analytics",
      error: error.message,
    });
  }
};
