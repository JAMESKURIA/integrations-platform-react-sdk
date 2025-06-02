/**
 * Integration Platform React SDK
 * Main export file for the SDK
 */

// Main SDK class
export { IntegrationPlatformClient } from "./client/IntegrationPlatformClient";

// React hooks
export { usePayment, usePaymentCallback } from "./hooks/usePayment";

// React components
export { CallbackHandler } from "./components/CallbackHandler";
export { LoadingSpinner } from "./components/LoadingSpinner";
export { PaymentForm } from "./components/PaymentForm";
export { PaymentModal } from "./components/PaymentModal";
export { PaymentStatus } from "./components/PaymentStatus";

// Types and interfaces
export type {
	CallbackHandlerOptions,
	CustomerInfo,
	FeeInfo,
	IntegrationPlatformError,
	// Core types
	Money,
	// Provider-specific types
	MpesaPaymentData,
	NextAction,
	// Event types
	PaymentCallback,
	PaymentCustomization,
	// Error types
	PaymentError,
	PaymentEvent,
	PaymentEventType,
	PaymentFormProps,
	PaymentFormRef,
	PaymentMethod,
	// Component prop types
	PaymentModalProps,
	// Ref types
	PaymentModalRef,
	PaymentProvider,
	PaymentProviderInfo,
	// Request/Response types
	PaymentRequest,
	PaymentResponse,
	PaymentStatusProps,
	PaymentStatus as PaymentStatusType,
	PaymentTheme,
	PayPalPaymentData,
	// Configuration types
	SDKConfig,
	StripePaymentData,
	UsePaymentActions,
	// Hook types
	UsePaymentState,
} from "./types";

// Utility functions and constants
export const PAYMENT_PROVIDERS = {
	MPESA: "MPESA" as const,
	PAYPAL: "PAYPAL" as const,
	STRIPE: "STRIPE" as const,
	FLUTTERWAVE: "FLUTTERWAVE" as const,
	RAZORPAY: "RAZORPAY" as const,
	CUSTOM: "CUSTOM" as const,
};

export const PAYMENT_METHODS = {
	MOBILE_MONEY: "MOBILE_MONEY" as const,
	CREDIT_CARD: "CREDIT_CARD" as const,
	DEBIT_CARD: "DEBIT_CARD" as const,
	BANK_TRANSFER: "BANK_TRANSFER" as const,
	PAYPAL: "PAYPAL" as const,
	CRYPTO: "CRYPTO" as const,
	CASH: "CASH" as const,
	OTHER: "OTHER" as const,
};

export const PAYMENT_STATUSES = {
	PENDING: "PENDING" as const,
	PROCESSING: "PROCESSING" as const,
	COMPLETED: "COMPLETED" as const,
	FAILED: "FAILED" as const,
	CANCELLED: "CANCELLED" as const,
	EXPIRED: "EXPIRED" as const,
};

// Default themes
export const DEFAULT_THEMES = {
	light: {
		primaryColor: "#007bff",
		secondaryColor: "#6c757d",
		backgroundColor: "#ffffff",
		textColor: "#333333",
		borderColor: "#dee2e6",
		borderRadius: "8px",
		fontSize: "14px",
		fontFamily: "system-ui, -apple-system, sans-serif",
		buttonStyle: "default" as const,
		modalStyle: "default" as const,
	},
	dark: {
		primaryColor: "#0d6efd",
		secondaryColor: "#6c757d",
		backgroundColor: "#212529",
		textColor: "#ffffff",
		borderColor: "#495057",
		borderRadius: "8px",
		fontSize: "14px",
		fontFamily: "system-ui, -apple-system, sans-serif",
		buttonStyle: "default" as const,
		modalStyle: "default" as const,
	},
	minimal: {
		primaryColor: "#000000",
		secondaryColor: "#666666",
		backgroundColor: "#ffffff",
		textColor: "#000000",
		borderColor: "#e0e0e0",
		borderRadius: "4px",
		fontSize: "13px",
		fontFamily: "Arial, sans-serif",
		buttonStyle: "minimal" as const,
		modalStyle: "minimal" as const,
	},
	modern: {
		primaryColor: "#6366f1",
		secondaryColor: "#8b5cf6",
		backgroundColor: "#ffffff",
		textColor: "#111827",
		borderColor: "#e5e7eb",
		borderRadius: "12px",
		fontSize: "14px",
		fontFamily: "Inter, system-ui, sans-serif",
		buttonStyle: "rounded" as const,
		modalStyle: "centered" as const,
	},
};

// Utility functions
export const createMoney = (amount: number, currency: string): Money => ({
	amount,
	currency: currency.toUpperCase(),
});

export const formatMoney = (money: Money, locale: string = "en-US"): string => {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency: money.currency,
	}).format(money.amount);
};

export const validateEmail = (email: string): boolean => {
	const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
	return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
	const phoneRegex = /^\+[1-9]\d{1,14}$/;
	return phoneRegex.test(phone);
};

export const isPaymentFinal = (status: string): boolean => {
	return ["COMPLETED", "FAILED", "CANCELLED", "EXPIRED"].includes(status);
};

export const getProviderDisplayName = (provider: PaymentProvider): string => {
	const names: Record<PaymentProvider, string> = {
		MPESA: "M-Pesa",
		PAYPAL: "PayPal",
		STRIPE: "Stripe",
		FLUTTERWAVE: "Flutterwave",
		RAZORPAY: "Razorpay",
		CUSTOM: "Custom Provider",
	};
	return names[provider] || provider;
};

export const getMethodDisplayName = (method: PaymentMethod): string => {
	const names: Record<PaymentMethod, string> = {
		MOBILE_MONEY: "Mobile Money",
		CREDIT_CARD: "Credit Card",
		DEBIT_CARD: "Debit Card",
		BANK_TRANSFER: "Bank Transfer",
		PAYPAL: "PayPal",
		CRYPTO: "Cryptocurrency",
		CASH: "Cash",
		OTHER: "Other",
	};
	return names[method] || method;
};

// Error factory functions
export const createPaymentError = (
	code: string,
	message: string,
	details?: Record<string, any>
): PaymentError => ({
	code,
	message,
	details,
});

export const createIntegrationError = (
	message: string,
	code: string,
	details?: Record<string, any>
): IntegrationPlatformError => {
	return new IntegrationPlatformError(message, code, details);
};

// SDK version
export const SDK_VERSION = "1.0.0";

// Default configuration
export const DEFAULT_SDK_CONFIG: Partial<SDKConfig> = {
	timeout: 30000,
	debug: false,
};

/**
 * Create a pre-configured SDK client
 */
export const createClient = (config: SDKConfig): IntegrationPlatformClient => {
	return new IntegrationPlatformClient({
		...DEFAULT_SDK_CONFIG,
		...config,
	});
};

/**
 * Generate callback URLs for payment processing
 */
export const generateCallbackUrls = (baseUrl: string) => ({
	returnUrl: `${baseUrl}/payment/success`,
	cancelUrl: `${baseUrl}/payment/cancel`,
	callbackUrl: `${baseUrl}/payment/callback`,
});

/**
 * Parse callback URL parameters
 */
export const parseCallbackParams = (url: string = window.location.href) => {
	const urlObj = new URL(url);
	const params = new URLSearchParams(urlObj.search);

	return {
		transactionId:
			params.get("transactionId") || params.get("transaction_id"),
		status: params.get("status"),
		error: params.get("error"),
		errorCode: params.get("errorCode") || params.get("error_code"),
		providerTransactionId:
			params.get("providerTransactionId") ||
			params.get("provider_transaction_id"),
		receiptNumber:
			params.get("receiptNumber") || params.get("receipt_number"),
	};
};
