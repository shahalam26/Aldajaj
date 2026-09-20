import User from "../model/user.model.js";

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (email !== undefined) {
      user.email = email.trim().toLowerCase();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const addAddress = async (req, res) => {
  try {
    const {
      label,
      addressLine,
      city,
      state,
      pincode,
      landmark,
       latitude,
  longitude,
    } = req.body;

    if (!addressLine || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Address, city, state and pincode are required",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.addresses.push({
      label: label || "HOME",
      addressLine: addressLine.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      landmark: landmark?.trim() || "",
      latitude,
  longitude,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const findCustomerByPhone = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const customer = await User.findOne({
      phone: phone.trim(),
      role: "user",
    }).select("-password");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const createPOSCustomer = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    const existingCustomer = await User.findOne({
      phone: phone.trim(),
    });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Customer with this phone number already exists",
      });
    }

    const customer = await User.create({
      name: name.trim(),
      phone: phone.trim(),
      role: "user",
      isPhoneVerified: false,
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        role: customer.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export { updateProfile,addAddress, findCustomerByPhone, createPOSCustomer,  };