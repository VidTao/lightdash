import React, { useState } from "react";
import { Modal, Input, InputNumber, Button, Form } from "antd";
import { apiService } from "../../services/api";
import { PaymentGatewaySettings } from "../../models/interfaces";

interface AddPaymentGatewayModalProps {
  open: boolean;
  onClose: () => void;
  refetchPaymentGateways: () => void;
}

const AddPaymentGatewayModal = ({ open, onClose, refetchPaymentGateways }: AddPaymentGatewayModalProps) => {
  const [form] = Form.useForm();
  const [writeKey] = useState<string>("b6175fb3-dc45-45b6-9da8-5fc0f4d0e21d");

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const paymentGatewaySettings: PaymentGatewaySettings = {
        gatewayId: 0,
        writeKey: writeKey,
        gatewayName: values.Name,
        percentageFee: values.Fee,
        fixedFee: values.Cost,
        isShopifyPayments: false,
      };

      const response = await apiService.insertPaymentGatewaySettings(paymentGatewaySettings);
      console.log("Payment gateway settings inserted:", response);
      onClose();
      refetchPaymentGateways();
    } catch (error) {
      console.error("Error inserting payment gateway settings:", error);
    }
  };

  const handleOnClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Add Payment Gateway"
      open={open}
      onCancel={handleOnClose}
      onOk={handleSubmit}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          Submit
        </Button>,
      ]}
    >
      <Form form={form} id="paymentGatewayForm" layout="vertical">
        <Form.Item name="Name" label="Name" rules={[{ required: true }]}>
          <Input placeholder="Name" />
        </Form.Item>
        <Form.Item name="Cost" label="Cost" rules={[{ required: true }]} initialValue={0}>
          <InputNumber placeholder="Cost" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="Fee" label="Fee %" rules={[{ required: true }]} initialValue={0}>
          <InputNumber placeholder="Fee" style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddPaymentGatewayModal;
