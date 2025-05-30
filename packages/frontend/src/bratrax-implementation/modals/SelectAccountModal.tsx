import { Modal, TreeDataNode } from "antd";
import { useState } from "react";
import AccountsSelect from "../selects/AccountsSelect";
import { AdPlatformAccountInfo } from "../../models/interfaces";

interface Props {
  modalTitle: string;
  isModalOpen: boolean;
  isLoading: boolean;
  handleOk: (selectedAccounts: AdPlatformAccountInfo[]) => void;
  handleCancel: () => void;
  accountsData: TreeDataNode[];
}

const SelectAccountModal = ({
  isLoading,
  isModalOpen,
  handleOk,
  handleCancel,
  accountsData,
  modalTitle,
}: Props) => {
  const [selectedAccounts, setSelectedAccounts] = useState<AdPlatformAccountInfo[]>([]);
  return (
    <>
      <Modal
        title={modalTitle}
        centered
        loading={isLoading}
        open={isModalOpen}
        onOk={() => handleOk(selectedAccounts)}
        onCancel={handleCancel}
        okText="Confirm"
        className="custom-modal-title"
      >
        <AccountsSelect
          data={accountsData}
          onSelectedAccountsChange={setSelectedAccounts}
        />
      </Modal>
    </>
  );
};

export default SelectAccountModal;
