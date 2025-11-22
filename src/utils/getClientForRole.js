import Client from "../models/Client.js";
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

    case "Admin":
      return await Client.findById(user.clientId);

    // case "Manager": {
    //   const manager = await Manager.findById(user.managerId);
    //   if (!manager) return null;
    //   return await Client.findById(manager.adminId);
    // }

    // case "Franchise": {
    //   const franchise = await Franchise.findById(user.franchiseId);
    //   if (!franchise) return null;
    //   return await Client.findById(franchise.adminId);
    // }

    // case "ChannelPartner": {
    //   const partner = await ChannelPartner.findById(user.channelPartnerId);
    //   if (!partner) return null;
    //   return await Client.findById(partner.adminId);
    // }

    default:
      return null;
  }
};
