import { Button, Checkbox, Collapse, Form, Input, InputNumber, Modal, Radio, Typography } from "antd";
import React, { useEffect, useState } from "react";

import { SearchOutlined, CloseOutlined, RightOutlined, DownOutlined } from "@ant-design/icons";
import { Region, ShippingProfile } from "../../models/interfaces";
import { apiService } from "../../services/api";

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface AddShippingProfileModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;
  refetchShippingProfiles: () => void;
  existingProfile?: ShippingProfile; // Optional prop for editing existing profile
  isEditMode?: boolean; // Flag to determine if we're in edit mode
}

const AddShippingProfileModal = ({
  isModalOpen,
  setIsModalOpen,
  refetchShippingProfiles,
  existingProfile,
  isEditMode = false,
}: AddShippingProfileModalProps) => {
  const regions = [
    {
      label: "North America",
      value: "north-america",
      countries: ["United States", "Canada", "Mexico"],
    },
    {
      label: "Europe",
      value: "europe",
      countries: ["United Kingdom", "France", "Germany", "Italy", "Spain"],
    },
    {
      label: "Asia",
      value: "asia",
      countries: ["China", "Japan", "South Korea", "India"],
    },
    {
      label: "South America",
      value: "south-america",
      countries: ["Brazil", "Argentina", "Chile", "Colombia"],
    },
    {
      label: "Oceania",
      value: "oceania",
      countries: ["Australia", "New Zealand"],
    },
    {
      label: "Africa",
      value: "africa",
      countries: ["South Africa", "Nigeria", "Kenya", "Egypt"],
    },
    {
      label: "Antarctica",
      value: "antarctica",
      countries: ["Antarctica"],
    },
  ];

  const [profileForm] = Form.useForm();
  const [selectedRegionType, setSelectedRegionType] = useState<"worldwide" | "specific">("specific");
  const [currentStep, setCurrentStep] = useState<"profile" | "rates">("profile");
  const [selectedRateType, setSelectedRateType] = useState<"fixed" | "tiered">("fixed");
  const [shippingRate, setShippingRate] = useState<number>(0);
  const [writeKey, setWriteKey] = useState<string>("b6175fb3-dc45-45b6-9da8-5fc0f4d0e21d");
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize form values from existing profile when in edit mode
  useEffect(() => {
    if (isEditMode && existingProfile) {
      // Set form field for profile name
      profileForm.setFieldsValue({
        profileName: existingProfile.profileName,
      });

      // Set state values from existing profile
      setSelectedRegionType(existingProfile.isWorldwide ? "worldwide" : "specific");
      setSelectedRateType(existingProfile.rateType as "fixed" | "tiered");
      setShippingRate(existingProfile.shippingRate);

      // If we have regions in the existing profile, set them
      if (existingProfile.regions) {
        setSelectedRegions(existingProfile.regions as Region[]);
      }

      // Set write key if it exists
      if (existingProfile.writeKey) {
        setWriteKey(existingProfile.writeKey);
      }
    }
  }, [isEditMode, existingProfile, profileForm]);

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setCurrentStep("profile");
    setSelectedRateType("fixed");
    setShippingRate(0);
    setSelectedRegions([]);
    profileForm.resetFields();
  };

  const handleModalNext = async () => {
    if (currentStep === "profile") {
      profileForm
        .validateFields()
        .then((values) => {
          console.log("Profile values:", values);
          setCurrentStep("rates");
        })
        .catch((info) => {
          console.log("Validate Failed:", info);
        });
    } else {
      // Handle save or update
      try {
        setIsLoading(true);
        const profileData = profileForm.getFieldsValue(true);

        const profilePayload: ShippingProfile = {
          profileId: existingProfile?.profileId || 0,
          profileName: profileData.profileName,
          writeKey: writeKey,
          isWorldwide: selectedRegionType === "worldwide",
          regions: selectedRegions,
          rateType: selectedRateType,
          shippingRate: shippingRate,
          weightTiers: existingProfile?.weightTiers || [],
          fulfillmentMethods: existingProfile?.fulfillmentMethods || [],
        };

        if (isEditMode && existingProfile?.profileId) {
          // Update existing profile
          profilePayload.profileId = existingProfile.profileId;
          await apiService.updateShippingProfile(profilePayload);
        } else {
          // Create new profile
          await apiService.insertShippingProfile(profilePayload);
        }

        refetchShippingProfiles();
        handleModalCancel();
      } catch (error) {
        console.error("Error saving shipping profile:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleModalPrevious = () => {
    setCurrentStep("profile");
  };

  return (
    <Modal
      title={isEditMode ? "Edit Shipping Profile" : "Create Shipping Profile"}
      open={isModalOpen}
      onCancel={handleModalCancel}
      footer={[
        <Button key="cancel" onClick={handleModalCancel}>
          Cancel
        </Button>,
        currentStep === "rates" && (
          <Button key="previous" onClick={handleModalPrevious}>
            Previous
          </Button>
        ),
        <Button key="next" type="primary" onClick={handleModalNext} loading={isLoading}>
          {currentStep === "profile" ? "Next" : isEditMode ? "Update" : "Save"}
        </Button>,
      ].filter(Boolean)}
      width={700}
      closeIcon={<CloseOutlined />}
    >
      {currentStep === "profile" ? (
        <Form form={profileForm} layout="vertical" requiredMark="optional">
          <Form.Item
            label="Profile Name"
            name="profileName"
            rules={[{ required: true, message: "Please enter profile name" }]}
          >
            <Input placeholder="Please enter profile name" />
          </Form.Item>

          <div className="space-y-4 mt-6">
            <Radio.Group
              value={selectedRegionType}
              onChange={(e) => setSelectedRegionType(e.target.value)}
              className="flex flex-col space-y-4"
            >
              <Radio value="worldwide">
                <span className="font-medium">Worldwide</span>
              </Radio>

              <Radio value="specific">
                <span className="font-medium">Specific countries/regions</span>
              </Radio>
            </Radio.Group>

            {selectedRegionType === "specific" && (
              <div className="mt-4">
                <Input placeholder="Search countries" prefix={<SearchOutlined />} className="mb-4" />

                <div className="space-y-2">
                  {regions.map((region) => (
                    <div
                      key={region.value}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        const isSelected = selectedRegions.some((selected) => selected.value === region.value);
                        const newSelectedRegions = isSelected
                          ? selectedRegions.filter((value) => value.value !== region.value)
                          : [...selectedRegions, region];
                        setSelectedRegions(newSelectedRegions);
                      }}
                    >
                      <Checkbox checked={selectedRegions.some((selected) => selected.value === region.value)} />
                      <span className="flex-grow text-left ml-2">{region.label}</span>
                      <RightOutlined className="text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Form>
      ) : (
        <div className="space-y-6">
          <div>
            <Title level={5}>Fulfillment Rates Settings</Title>
          </div>

          <Radio.Group
            value={selectedRateType}
            onChange={(e) => setSelectedRateType(e.target.value)}
            className="flex flex-col space-y-4"
          >
            <Radio value="fixed">
              <span className="font-medium">Fixed Rate</span>
            </Radio>

            <Radio value="tiered">
              <span className="font-medium">Order weight-based tiered rates</span>
            </Radio>
          </Radio.Group>

          <div className="mt-6">
            <Title level={5}>Shipping Rate</Title>
            <div className="flex items-center gap-2">
              <span className="text-lg">$</span>
              <InputNumber
                className="flex-grow"
                value={shippingRate}
                onChange={(value) => setShippingRate(value || 0)}
                min={0}
                precision={2}
                placeholder="Enter shipping rate"
              />
            </div>
          </div>

          <div className="mt-6">
            <Collapse expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 180 : 0} />}>
              <Panel header="Fulfillment Methods" key="1">
                <div className="p-4">
                  <Text>Configure fulfillment methods here</Text>
                </div>
              </Panel>
            </Collapse>
          </div>

          {selectedRateType === "fixed" && shippingRate === 0 && (
            <div className="mt-4 text-red-500">Please enter a cost for all rates</div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default AddShippingProfileModal;
