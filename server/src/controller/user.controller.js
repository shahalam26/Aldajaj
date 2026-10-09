import User from "../model/user.model.js";

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    console.error("getCurrentUser error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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

    // Name validation
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      user.name = name.trim();
    }

    // Email validation
    if (email !== undefined) {
      const trimmedEmail = email.trim().toLowerCase();

      if (!trimmedEmail) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email address",
        });
      }

      user.email = trimmedEmail;
    }

    await user.save();

    return res.status(200).json({
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
    console.error("updateProfile error:", error);

    return res.status(500).json({
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
      isDefault,
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

    // If this address is going to be default,
    // remove default status from existing addresses.
    if (isDefault === true) {
      user.addresses.forEach((address) => {
        address.isDefault = false;
      });
    }

    // If user has no address yet, make the first address default.
    const shouldBeDefault =
      isDefault === true || user.addresses.length === 0;

    user.addresses.push({
      label: label || "HOME",
      addressLine: addressLine.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      landmark: landmark?.trim() || "",
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      isDefault: shouldBeDefault,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("addAddress error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const {
      label,
      addressLine,
      city,
      state,
      pincode,
      landmark,
      latitude,
      longitude,
      isDefault,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // If this address is being made default,
    // remove default status from all other addresses.
    if (isDefault === true) {
      user.addresses.forEach((item) => {
        item.isDefault = false;
      });

      address.isDefault = true;
    }

    if (label !== undefined) {
      address.label = label;
    }

    if (addressLine !== undefined) {
      address.addressLine = addressLine.trim();
    }

    if (city !== undefined) {
      address.city = city.trim();
    }

    if (state !== undefined) {
      address.state = state.trim();
    }

    if (pincode !== undefined) {
      address.pincode = pincode.trim();
    }

    if (landmark !== undefined) {
      address.landmark = landmark.trim();
    }

    if (latitude !== undefined) {
      address.latitude = latitude;
    }

    if (longitude !== undefined) {
      address.longitude = longitude;
    }

    if (isDefault !== undefined && isDefault === false) {
      address.isDefault = false;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("updateAddress error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    address.deleteOne();

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("deleteAddress error:", error);

    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("findCustomerByPhone error:", error);

    return res.status(500).json({
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

    return res.status(201).json({
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
    console.error("createPOSCustomer error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  getCurrentUser,
  updateProfile,
  addAddress,
  findCustomerByPhone,
  createPOSCustomer,
  updateAddress,
  deleteAddress,
};