import Client from "../models/Client.js";
import Manager from "../models/Manager.js";
// import Admin from "../models/Admin.js";
// import Manager from "../models/Manager.js";
// import Franchise from "../models/Franchise.js";
// import ChannelPartner from "../models/ChannelPartner.js";
// import User from "../models/User.js";

export const getClientForRole = async (user) => {
  // console.log(`this is from getClientForRole ${user}`);
  switch (user.role) {
    case "SuperAdmin":
      return null;

    // case "Admin":
    //   return await Client.findById(user.clientId);

    case "Admin": {
      const client = await Client.findById(user.clientId);
      if (!client) throw new Error("Client not found for this Admin.");

      if (!client.isActive) {
        throw new Error(
          "Your institution is deactivated. Please contact SuperAdmin."
        );
      }

      return client;
    }
    case "Manager": {
      // Manager must belong to a Client
      const client = await Client.findById(user.clientId);
      if (!client) {
        throw new Error("Client not found for this Manager.");
      }
      // 🔥 IMPORTANT: block manager if Client deactivated
      if (!client.isActive) {
        throw new Error(
          "Your institution is deactivated. Please contact your Admin."
        );
      }
      return client;
    }

    case "Franchise": {
      //   const franchise = await Franchise.findById(user.franchiseId);
      //   if (!franchise) return null;
      //   return await Client.findById(franchise.adminId);
      const client = await Client.findById(user.clientId);
      if (!client) throw new Error("Client not found for this Franchise.");

      if (!client.isActive) {
        throw new Error(
          "Your institution is deactivated. Please contact Admin."
        );
      }

      return client;
    }

    case "ChannelPartner": {
      //   const partner = await ChannelPartner.findById(user.channelPartnerId);
      //   if (!partner) return null;
      //   return await Client.findById(partner.adminId);
      const client = await Client.findById(user.clientId);
      if (!client)
        throw new Error("Client not found for this Channel Partner.");

      if (!client.isActive) {
        throw new Error(
          "Your institution is deactivated. Please contact Admin."
        );
      }

      return client;
    }

    default:
      return null;
  }
};
