import React, { useState } from "react";
import { Modal, Form, Input, Button, Typography, Divider, Alert } from "antd";
import { UserOutlined, LockOutlined, LoginOutlined } from "@ant-design/icons";
// import "./OutbrainLoginModal.css"; // We'll create this CSS file next

const { Text, Title } = Typography;

interface OutbrainLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (encodedAuth: string) => Promise<void>;
  isLoading: boolean;
}

const OutbrainLoginModal: React.FC<OutbrainLoginModalProps> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [form] = Form.useForm();
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setAuthError(null);
      const values = await form.validateFields();
      const { username, password } = values;

      // Create base64 encoded auth string
      const authString = `${username}:${password}`;
      const encodedAuth = btoa(authString);

      await onSubmit(encodedAuth);

      // Reset form after successful submission
      form.resetFields();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleCancel = () => {
    setAuthError(null);
    form.resetFields();
    onClose();
  };

  const modalTitleStyle = {
    color: "white",
    fontWeight: 600,
    fontSize: "18px",
  };

  return (
    <Modal
      title="Connect to Outbrain"
      open={isOpen}
      onCancel={handleCancel}
      width={480}
      centered
      footer={null}
      maskClosable={false}
      className="outbrain-login-modal"
      modalRender={(node) => {
        return <div className="custom-outbrain-modal">{node}</div>;
      }}
    >
      <div className="logo-container">
        <img src="/public/images/outbrain-logo.png" alt="Outbrain Logo" className="outbrain-logo" />
      </div>

      <Title level={4} style={{ textAlign: "center", marginBottom: 20 }}>
        Sign in to your Outbrain account
      </Title>

      <Text style={{ display: "block", marginBottom: 24, textAlign: "center" }}>
        Enter your Outbrain credentials to connect and access your campaign data
      </Text>

      {authError && (
        <Alert
          message="Authentication Error"
          description={authError}
          type="error"
          showIcon
          style={{ marginBottom: 20 }}
          closable
          onClose={() => setAuthError(null)}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        name="outbrain_login"
        initialValues={{ remember: true }}
        requiredMark={false}
        className="outbrain-form"
      >
        <Form.Item
          name="username"
          label="Email Address"
          rules={[
            { required: true, message: "Please enter your Outbrain email" },
            { type: "email", message: "Please enter a valid email address" },
          ]}
        >
          <Input
            prefix={<UserOutlined style={{ color: "#f26522" }} />}
            placeholder="Enter your email"
            size="large"
            autoComplete="email"
            className="outbrain-input"
          />
        </Form.Item>

        <Form.Item name="password" label="Password" rules={[{ required: true, message: "Please enter your password" }]}>
          <Input.Password
            prefix={<LockOutlined style={{ color: "#f26522" }} />}
            placeholder="Enter your password"
            size="large"
            autoComplete="current-password"
            className="outbrain-input"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 12, marginTop: 24 }}>
          <Button
            type="primary"
            block
            size="large"
            loading={isLoading}
            onClick={handleSubmit}
            icon={<LoginOutlined />}
            className="outbrain-button outbrain-primary-button"
          >
            Connect to Outbrain
          </Button>
        </Form.Item>

        <Form.Item>
          <Button block size="large" onClick={handleCancel} className="outbrain-button">
            Cancel
          </Button>
        </Form.Item>
      </Form>

      <Divider plain style={{ margin: "16px 0" }}>
        <Text type="secondary">Secure Connection</Text>
      </Divider>

      <div style={{ padding: "0 12px" }}>
        <Text type="secondary" style={{ fontSize: "12px", display: "block", textAlign: "center" }}>
          Your credentials are securely used for authentication only and are not stored. This connection will allow
          access to your Outbrain campaign data.
        </Text>
      </div>

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <a
          href="https://www.outbrain.com/help/advertisers/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: "13px", color: "#f26522" }}
        >
          Need help with your Outbrain account?
        </a>
      </div>
    </Modal>
  );
};

export default OutbrainLoginModal;
