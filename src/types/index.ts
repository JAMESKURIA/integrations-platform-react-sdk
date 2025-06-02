/**
 * Core types for Integration Platform React SDK
 * Comprehensive type definitions for payment processing
 */

// ===== MONEY TYPES =====
export interface Money {
	amount: number;
	currency: string;
}

// ===== PAYMENT PROVIDER TYPES =====
export type PaymentProvider =
	| "MPESA"
	| "PAYPAL"
	| "STRIPE"
	| "FLUTTERWAVE"
	| "RAZORPAY"
	| "CUSTOM";
export type PaymentMethod =
	| "MOBILE_MONEY"
	| "CREDIT_CARD"
	| "DEBIT_CARD"
	| "BANK_TRANSFER"
	| "PAYPAL"
	| "CRYPTO"
	| "CASH"
	| "OTHER";
export type PaymentStatus =
	| "PENDING"
	| "PROCESSING"
	| "COMPLETED"
	| "FAILED"
	| "CANCELLED"
	| "EXPIRED";

// ===== CUSTOMER INFORMATION =====
export interface CustomerInfo {
	name: string;
	email?: string;
	phone?: string;
	customerId?: string;
}

// ===== PAYMENT REQUEST/RESPONSE =====
export interface PaymentRequest {
	amount: Money;
	provider: PaymentProvider;
	paymentMethod: PaymentMethod;
	billRefNumber?: string;
	customerName: string;
	customerEmail?: string;
	customerPhone?: string;
	description?: string;
	callbackUrl?: string;
	returnUrl?: string;
	cancelUrl?: string;
	metadata?: Record<string, any>;
	providerSpecificData?: Record<string, any>;
}

export interface NextAction {
	type:
		| "NONE"
		| "REDIRECT"
		| "DISPLAY_QR"
		| "USSD_DIAL"
		| "WAIT_FOR_PUSH"
		| "DISPLAY_INSTRUCTIONS";
	url?: string;
	qrCode?: string;
	ussdCode?: string;
	instructions?: string;
	pollIntervalSeconds?: number;
}

export interface PaymentResponse {
	transactionId: string;
	billRefNumber?: string;
	provider: PaymentProvider;
	amount: Money;
	status: PaymentStatus;
	statusMessage: string;
	providerTransactionId?: string;
	providerReceiptNumber?: string;
	customerInstructions?: string;
	paymentUrl?: string;
	qrCodeData?: string;
	createdAt: string;
	updatedAt: string;
	expiresAt?: string;
	errorCode?: string;
	errorMessage?: string;
	nextAction?: NextAction;
	metadata?: Record<string, any>;
}

// ===== PROVIDER INFORMATION =====
export interface FeeInfo {
	fixedFee?: number;
	percentageFee?: number;
	currency: string;
	description: string;
}

export interface PaymentProviderInfo {
	code: string;
	name: string;
	description: string;
	logoUrl?: string;
	supportedCurrencies: string[];
	supportedMethods: PaymentMethod[];
	supportedCountries: string[];
	minimumAmount?: number;
	maximumAmount?: number;
	fees?: FeeInfo;
	active: boolean;
	processingTime?: string;
}

// ===== SDK CONFIGURATION =====
export interface SDKConfig {
	baseUrl: string;
	tenantId: string;
	authToken?: string;
	timeout?: number;
	debug?: boolean;
}

// ===== PAYMENT MODAL PROPS =====
export interface PaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: (payment: PaymentResponse) => void;
	onError: (error: PaymentError) => void;
	paymentData: Omit<PaymentRequest, "provider" | "paymentMethod">;
	config: SDKConfig;
	theme?: PaymentTheme;
	showProviderLogos?: boolean;
	allowedProviders?: PaymentProvider[];
	excludedProviders?: PaymentProvider[];
	customization?: PaymentCustomization;
}

// ===== PAYMENT FORM PROPS =====
export interface PaymentFormProps {
	onSubmit: (paymentData: PaymentRequest) => void;
	providers: PaymentProviderInfo[];
	config: SDKConfig;
	theme?: PaymentTheme;
	loading?: boolean;
	error?: string;
	customization?: PaymentCustomization;
}

// ===== PAYMENT STATUS PROPS =====
export interface PaymentStatusProps {
	payment: PaymentResponse;
	onClose: () => void;
	onRetry?: () => void;
	theme?: PaymentTheme;
	showTransactionDetails?: boolean;
}

// ===== THEME CONFIGURATION =====
export interface PaymentTheme {
	primaryColor?: string;
	secondaryColor?: string;
	backgroundColor?: string;
	textColor?: string;
	borderColor?: string;
	borderRadius?: string;
	fontSize?: string;
	fontFamily?: string;
	buttonStyle?: "default" | "rounded" | "minimal" | "gradient";
	modalStyle?: "default" | "centered" | "fullscreen" | "minimal";
}

// ===== CUSTOMIZATION OPTIONS =====
export interface PaymentCustomization {
	title?: string;
	subtitle?: string;
	customerFieldsRequired?: {
		email?: boolean;
		phone?: boolean;
	};
	showAmountBreakdown?: boolean;
	showPaymentMethods?: boolean;
	showProviderLogos?: boolean;
	enabledCurrencies?: string[];
	paymentMethodOrder?: PaymentMethod[];
	customCSS?: string;
	translations?: Record<string, string>;
}

// ===== ERROR HANDLING =====
export interface PaymentError {
	code: string;
	message: string;
	details?: Record<string, any>;
	transactionId?: string;
}

export class IntegrationPlatformError extends Error {
	code: string;
	details?: Record<string, any>;

	constructor(message: string, code: string, details?: Record<string, any>) {
		super(message);
		this.name = "IntegrationPlatformError";
		this.code = code;
		this.details = details;
	}
}

// ===== WEBHOOK/CALLBACK TYPES =====
export interface PaymentCallback {
	type: "success" | "error" | "cancelled";
	payment?: PaymentResponse;
	error?: PaymentError;
	metadata?: Record<string, any>;
}

export interface CallbackHandlerOptions {
	successCallback?: (payment: PaymentResponse) => void;
	errorCallback?: (error: PaymentError) => void;
	cancelCallback?: () => void;
	pollInterval?: number;
	maxPollAttempts?: number;
}

// ===== HOOK TYPES =====
export interface UsePaymentState {
	payment: PaymentResponse | null;
	loading: boolean;
	error: PaymentError | null;
	providers: PaymentProviderInfo[];
	providersLoading: boolean;
}

export interface UsePaymentActions {
	initiatePayment: (paymentData: PaymentRequest) => Promise<PaymentResponse>;
	checkPaymentStatus: (transactionId: string) => Promise<PaymentResponse>;
	cancelPayment: (
		transactionId: string,
		reason?: string
	) => Promise<PaymentResponse>;
	fetchProviders: () => Promise<PaymentProviderInfo[]>;
	reset: () => void;
}

// ===== COMPONENT REF TYPES =====
export interface PaymentModalRef {
	openModal: () => void;
	closeModal: () => void;
	isOpen: boolean;
}

export interface PaymentFormRef {
	submit: () => void;
	reset: () => void;
	setLoading: (loading: boolean) => void;
}

// ===== UTILITY TYPES =====
export type PaymentEventType =
	| "initiated"
	| "processing"
	| "completed"
	| "failed"
	| "cancelled";

export interface PaymentEvent {
	type: PaymentEventType;
	payment: PaymentResponse;
	timestamp: Date;
}

// ===== PROVIDER-SPECIFIC TYPES =====
export interface MpesaPaymentData {
	phoneNumber: string;
	accountReference?: string;
	transactionDesc?: string;
}

export interface StripePaymentData {
	cardToken?: string;
	saveCard?: boolean;
	customerId?: string;
}

export interface PayPalPaymentData {
	payerId?: string;
	intent?: "sale" | "authorize" | "order";
}
