import Client from "../models/Client.js"; // Assuming your Client model path

/**
 * Middleware to check if the logging-in user is active AND if their associated
 * institution/client is also active.
 *
 * This should run during the login process, before generating the auth token.
 *
 * @param {object} user - The user document found during login (before token generation).
 * @returns {Promise<boolean>} True if access is allowed, false otherwise.
 */
export const checkActiveHierarchy = async (user) => {
  // 1. Check the user's own isActive status
  if (!user.isActive) {
    console.log(`Access denied: User ${user.email} is inactive.`);
    return false;
  }

  // 2. Check Client/Institution status (Only for non-SuperAdmin roles)
  if (user.role !== "SuperAdmin") {
    if (!user.clientId) {
      console.log(`Access denied: User ${user.email} is missing clientId.`);
      // Should not happen if validation in userSchema works, but good for safety
      return false;
    }

    try {
      // Find the associated Client/Institution
      const client = await Client.findById(user.clientId);

      if (!client) {
        console.log(`Access denied: Client ID ${user.clientId} not found.`);
        return false;
      }

      if (!client.isActive) {
        console.log(
          `Access denied: Institution ${client.institutionName} (ID: ${client._id}) is inactive.`
        );
        return false;
      }
    } catch (error) {
      console.error("Error during active hierarchy check:", error);
      return false;
    }
  }

  // 3. If all checks pass, allow login
  return true;
};
// ```
// eof

// ### 3. Integrate into your Login Controller

// You would then integrate this check into your existing login controller logic (e.g., in `authController.js`):

// ```javascript
// ... inside your login controller function ...
// const user = await User.findOne({ email }); // Assume this line successfully found the user

if (user && bcrypt.compareSync(password, user.passwordHash)) {
  // 🎯 STEP 1: Run the hierarchy check middleware
  const isAccessAllowed = await checkActiveHierarchy(user);

  if (!isAccessAllowed) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Your account or your institution's account is currently inactive.",
    });
  }

  // 🎯 STEP 2: If access is allowed, proceed to generate token and respond
  const token = jwt.sign(
    {
      /* payload */
    },
    config.secret,
    { expiresIn: 86400 }
  );
  return res.status(200).json({
    success: true,
    message: "Login successful",
    accessToken: token,
  });
}
// ... rest of the controller ...
