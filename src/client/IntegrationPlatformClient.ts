/**
 * Integration Platform API Client
 * Handles all communication with the Integration Platform backend
 */

import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
	IntegrationPlatformError,
	PaymentError,
	PaymentProviderInfo,
	PaymentRequest,
	PaymentResponse,
	SDKConfig,
} from "../types";

export class IntegrationPlatformClient {
	private axiosInstance: AxiosInstance;
	private config: SDKConfig;

	constructor(config: SDKConfig) {
		this.config = config;
		this.axiosInstance = this.createAxiosInstance();
	}

	/**
	 * Create and configure axios instance
	 */
	private createAxiosInstance(): AxiosInstance {
		const instance = axios.create({
			baseURL: this.config.baseUrl,
			timeout: this.config.timeout || 30000,
			headers: {
				"Content-Type": "application/json",
				"X-Tenant-ID": this.config.tenantId,
			},
		});

		// Add auth header if token provided
		if (this.config.authToken) {
			instance.defaults.headers.common[
				"Authorization"
			] = `Bearer ${this.config.authToken}`;
		}

		// Request interceptor for logging
		instance.interceptors.request.use(
			(config) => {
				if (this.config.debug) {
					console.log("🔄 API Request:", {
						method: config.method?.toUpperCase(),
						url: config.url,
						data: config.data,
						headers: config.headers,
					});
				}
				return config;
			},
			(error) => {
				if (this.config.debug) {
					console.error("❌ Request Error:", error);
				}
				return Promise.reject(error);
			}
		);

		// Response interceptor for error handling
		instance.interceptors.response.use(
			(response: AxiosResponse) => {
				if (this.config.debug) {
					console.log("✅ API Response:", {
						status: response.status,
						data: response.data,
					});
				}
				return response;
			},
			(error) => {
				const enhancedError = this.handleApiError(error);
				if (this.config.debug) {
					console.error("❌ API Error:", enhancedError);
				}
				return Promise.reject(enhancedError);
			}
		);

		return instance;
	}

	/**
	 * Enhanced error handling for API responses
	 */
	private handleApiError(error: any): IntegrationPlatformError {
		if (error.response) {
			// Server responded with error status
			const { status, data } = error.response;
			const errorCode = data?.code || `HTTP_${status}`;
			const errorMessage =
				data?.message ||
				error.message ||
				"An unexpected error occurred";

			return new IntegrationPlatformError(errorMessage, errorCode, {
				status,
				response: data,
				originalError: error,
			});
		} else if (error.request) {
			// Network error
			return new IntegrationPlatformError(
				"Network error: Unable to connect to Integration Platform",
				"NETWORK_ERROR",
				{ originalError: error }
			);
		} else {
			// Something else happened
			return new IntegrationPlatformError(
				error.message || "An unexpected error occurred",
				"UNKNOWN_ERROR",
				{ originalError: error }
			);
		}
	}

	/**
	 * Initiate a payment
	 */
	async initiatePayment(
		paymentData: PaymentRequest
	): Promise<PaymentResponse> {
		try {
			const response = await this.axiosInstance.post<PaymentResponse>(
				"/api/v1/payments/initiate",
				paymentData
			);
			return response.data;
		} catch (error) {
			throw this.enhancePaymentError(
				error as IntegrationPlatformError,
				"PAYMENT_INITIATION_FAILED"
			);
		}
	}

	/**
	 * Check payment status
	 */
	async checkPaymentStatus(transactionId: string): Promise<PaymentResponse> {
		try {
			const response = await this.axiosInstance.get<PaymentResponse>(
				`/api/v1/payments/${transactionId}/status`
			);
			return response.data;
		} catch (error) {
			throw this.enhancePaymentError(
				error as IntegrationPlatformError,
				"PAYMENT_STATUS_CHECK_FAILED"
			);
		}
	}

	/**
	 * Cancel a payment
	 */
	async cancelPayment(
		transactionId: string,
		reason?: string
	): Promise<PaymentResponse> {
		try {
			const response = await this.axiosInstance.post<PaymentResponse>(
				`/api/v1/payments/${transactionId}/cancel`,
				null,
				{
					params: { reason },
				}
			);
			return response.data;
		} catch (error) {
			throw this.enhancePaymentError(
				error as IntegrationPlatformError,
				"PAYMENT_CANCELLATION_FAILED"
			);
		}
	}

	/**
	 * Get supported payment providers
	 */
	async getSupportedProviders(): Promise<PaymentProviderInfo[]> {
		try {
			const response = await this.axiosInstance.get<
				PaymentProviderInfo[]
			>("/api/v1/payments/providers");
			return response.data;
		} catch (error) {
			throw this.enhancePaymentError(
				error as IntegrationPlatformError,
				"PROVIDERS_FETCH_FAILED"
			);
		}
	}

	/**
	 * Get payment history for a customer
	 */
	async getPaymentHistory(
		options: {
			customerPhone?: string;
			customerEmail?: string;
			billRefNumber?: string;
			status?: string;
			page?: number;
			size?: number;
		} = {}
	): Promise<PaymentResponse[]> {
		try {
			const response = await this.axiosInstance.get<PaymentResponse[]>(
				"/api/v1/payments/history",
				{ params: options }
			);
			return response.data;
		} catch (error) {
			throw this.enhancePaymentError(
				error as IntegrationPlatformError,
				"PAYMENT_HISTORY_FETCH_FAILED"
			);
		}
	}

	/**
	 * Poll payment status with automatic retries
	 */
	async pollPaymentStatus(
		transactionId: string,
		options: {
			interval?: number;
			maxAttempts?: number;
			onUpdate?: (payment: PaymentResponse) => void;
		} = {}
	): Promise<PaymentResponse> {
		const { interval = 5000, maxAttempts = 24, onUpdate } = options; // Poll for up to 2 minutes
		let attempts = 0;

		return new Promise((resolve, reject) => {
			const poll = async () => {
				try {
					attempts++;
					const payment = await this.checkPaymentStatus(
						transactionId
					);

					// Call update callback if provided
					if (onUpdate) {
						onUpdate(payment);
					}

					// Check if payment is in final state
					if (this.isPaymentFinal(payment.status)) {
						resolve(payment);
						return;
					}

					// Check if we've exceeded max attempts
					if (attempts >= maxAttempts) {
						reject(
							new IntegrationPlatformError(
								"Payment status polling timeout",
								"POLLING_TIMEOUT",
								{ transactionId, attempts }
							)
						);
						return;
					}

					// Schedule next poll
					setTimeout(poll, interval);
				} catch (error) {
					reject(error);
				}
			};

			// Start polling
			poll();
		});
	}

	/**
	 * Check if payment status is final
	 */
	private isPaymentFinal(status: string): boolean {
		return ["COMPLETED", "FAILED", "CANCELLED", "EXPIRED"].includes(status);
	}

	/**
	 * Enhance payment-specific errors
	 */
	private enhancePaymentError(
		error: IntegrationPlatformError,
		fallbackCode: string
	): PaymentError {
		return {
			code: error.code || fallbackCode,
			message: error.message,
			details: error.details,
		};
	}

	/**
	 * Update SDK configuration
	 */
	updateConfig(newConfig: Partial<SDKConfig>): void {
		this.config = { ...this.config, ...newConfig };

		// Update axios instance headers
		if (newConfig.tenantId) {
			this.axiosInstance.defaults.headers.common["X-Tenant-ID"] =
				newConfig.tenantId;
		}
		if (newConfig.authToken) {
			this.axiosInstance.defaults.headers.common[
				"Authorization"
			] = `Bearer ${newConfig.authToken}`;
		}
		if (newConfig.baseUrl) {
			this.axiosInstance.defaults.baseURL = newConfig.baseUrl;
		}
		if (newConfig.timeout) {
			this.axiosInstance.defaults.timeout = newConfig.timeout;
		}
	}

	/**
	 * Health check for the API
	 */
	async healthCheck(): Promise<{ status: string; timestamp: string }> {
		try {
			const response = await this.axiosInstance.get("/actuator/health");
			return {
				status: response.data.status || "UP",
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			throw new IntegrationPlatformError(
				"Health check failed",
				"HEALTH_CHECK_FAILED",
				{ originalError: error }
			);
		}
	}

	/**
	 * Validate payment data before submission
	 */
	validatePaymentData(paymentData: PaymentRequest): {
		valid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		// Required fields validation
		if (!paymentData.amount || paymentData.amount.amount <= 0) {
			errors.push("Amount must be greater than zero");
		}

		if (!paymentData.amount?.currency) {
			errors.push("Currency is required");
		}

		if (!paymentData.provider) {
			errors.push("Payment provider is required");
		}

		if (!paymentData.paymentMethod) {
			errors.push("Payment method is required");
		}

		if (!paymentData.customerName?.trim()) {
			errors.push("Customer name is required");
		}

		// Provider-specific validation
		if (paymentData.provider === "MPESA" && !paymentData.customerPhone) {
			errors.push("Phone number is required for M-Pesa payments");
		}

		if (
			["PAYPAL", "STRIPE"].includes(paymentData.provider) &&
			!paymentData.customerEmail
		) {
			errors.push("Email is required for PayPal and Stripe payments");
		}

		// Email format validation
		if (
			paymentData.customerEmail &&
			!this.isValidEmail(paymentData.customerEmail)
		) {
			errors.push("Invalid email format");
		}

		// Phone format validation (basic)
		if (
			paymentData.customerPhone &&
			!this.isValidPhone(paymentData.customerPhone)
		) {
			errors.push("Invalid phone number format");
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Email validation
	 */
	private isValidEmail(email: string): boolean {
		const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
		return emailRegex.test(email);
	}

	/**
	 * Phone validation (international format)
	 */
	private isValidPhone(phone: string): boolean {
		const phoneRegex = /^\+[1-9]\d{1,14}$/;
		return phoneRegex.test(phone);
	}

	/**
	 * Get current configuration
	 */
	getConfig(): SDKConfig {
		return { ...this.config };
	}
}
