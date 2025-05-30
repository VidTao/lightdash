import { apiService } from "../services/api";
import { useEffect, useState } from "react";
import { PaymentGatewaySettings } from "../models/interfaces";

export const usePaymentGateways = () => {
  const [paymentGateways, setPaymentGateways] = useState<PaymentGatewaySettings[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchPaymentGateways = async () => {
    try {
      setIsLoading(true);
      const results = await apiService.getPaymentGateways();
      setPaymentGateways(results.data);
    } catch (error) {
      console.error("Error fetching payment gateways:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchPaymentGateways();
  }, []);

  return { paymentGateways, fetchPaymentGateways, isLoading, setPaymentGateways };
};
