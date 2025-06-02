/**
 * Custom React hook for payment processing
 * Provides state management and actions for payment operations
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { IntegrationPlatformClient } from "../client/IntegrationPlatformClient";
import {
	CallbackHandlerOptions,
	PaymentError,
	PaymentProviderInfo,
	PaymentRequest,
	PaymentResponse,
	SDKConfig,
	UsePaymentActions,
	UsePaymentState,
} from "../types";

export interface UsePaymentOptions {
	config: SDKConfig;
	autoFetchProviders?: boolean;
	pollInterval?: number;
	maxPollAttempts?: number;
	onPaymentUpdate?: (payment: PaymentResponse) => void;
	onPaymentComplete?: (payment: PaymentResponse) => void;
	onPaymentError?: (error: PaymentError) => void;
}

export function usePayment(
	options: UsePaymentOptions
): UsePaymentState & UsePaymentActions {
	const {
		config,
		autoFetchProviders = true,
		pollInterval = 5000,
		maxPollAttempts = 24,
		onPaymentUpdate,
		onPaymentComplete,
		onPaymentError,
	} = options;

	// State management
	const [payment, setPayment] = useState<PaymentResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<PaymentError | null>(null);
	const [providers, setProviders] = useState<PaymentProviderInfo[]>([]);
	const [providersLoading, setProvidersLoading] = useState(false);

	// Refs for cleanup and polling
	const clientRef = useRef<IntegrationPlatformClient>();
	const pollTimeoutRef = useRef<NodeJS.Timeout>();
	const mountedRef = useRef(true);

	// Initialize client
	useEffect(() => {
		clientRef.current = new IntegrationPlatformClient(config);

		return () => {
			mountedRef.current = false;
			if (pollTimeoutRef.current) {
				clearTimeout(pollTimeoutRef.current);
			}
		};
	}, [config]);

	// Auto-fetch providers on mount
	useEffect(() => {
		if (autoFetchProviders && clientRef.current) {
			fetchProviders();
		}
	}, [autoFetchProviders]);

	/**
	 * Clear error state
	 */
	const clearError = useCallback(() => {
		setError(null);
	}, []);

	/**
	 * Set error state with enhanced error handling
	 */
	const handleError = useCallback(
		(err: any) => {
			const paymentError: PaymentError = {
				code: err.code || "UNKNOWN_ERROR",
				message: err.message || "An unexpected error occurred",
				details: err.details,
				transactionId: payment?.transactionId,
			};

			setError(paymentError);
			setLoading(false);

			if (onPaymentError) {
				onPaymentError(paymentError);
			}
		},
		[payment, onPaymentError]
	);

	/**
	 * Fetch available payment providers
	 */
	const fetchProviders = useCallback(async (): Promise<
		PaymentProviderInfo[]
	> => {
		if (!clientRef.current) {
			throw new Error("Payment client not initialized");
		}

		try {
			setProvidersLoading(true);
			clearError();

			const fetchedProviders =
				await clientRef.current.getSupportedProviders();

			if (mountedRef.current) {
				setProviders(fetchedProviders);
				setProvidersLoading(false);
			}

			return fetchedProviders;
		} catch (err) {
			if (mountedRef.current) {
				setProvidersLoading(false);
				handleError(err);
			}
			throw err;
		}
	}, [clearError, handleError]);

	/**
	 * Initiate a payment with enhanced validation and polling
	 */
	const initiatePayment = useCallback(
		async (paymentData: PaymentRequest): Promise<PaymentResponse> => {
			if (!clientRef.current) {
				throw new Error("Payment client not initialized");
			}

			try {
				setLoading(true);
				clearError();
				setPayment(null);

				// Validate payment data
				const validation =
					clientRef.current.validatePaymentData(paymentData);
				if (!validation.valid) {
					throw new Error(
						`Validation failed: ${validation.errors.join(", ")}`
					);
				}

				// Initiate payment
				const initiatedPayment =
					await clientRef.current.initiatePayment(paymentData);

				if (mountedRef.current) {
					setPayment(initiatedPayment);
					setLoading(false);

					if (onPaymentUpdate) {
						onPaymentUpdate(initiatedPayment);
					}

					// Start polling if payment is not in final state
					if (!isPaymentFinal(initiatedPayment.status)) {
						startPolling(initiatedPayment.transactionId);
					} else if (
						initiatedPayment.status === "COMPLETED" &&
						onPaymentComplete
					) {
						onPaymentComplete(initiatedPayment);
					}
				}

				return initiatedPayment;
			} catch (err) {
				if (mountedRef.current) {
					handleError(err);
				}
				throw err;
			}
		},
		[clearError, handleError, onPaymentUpdate, onPaymentComplete]
	);

	/**
	 * Check payment status
	 */
	const checkPaymentStatus = useCallback(
		async (transactionId: string): Promise<PaymentResponse> => {
			if (!clientRef.current) {
				throw new Error("Payment client not initialized");
			}

			try {
				setLoading(true);
				clearError();

				const updatedPayment =
					await clientRef.current.checkPaymentStatus(transactionId);

				if (mountedRef.current) {
					setPayment(updatedPayment);
					setLoading(false);

					if (onPaymentUpdate) {
						onPaymentUpdate(updatedPayment);
					}

					if (
						updatedPayment.status === "COMPLETED" &&
						onPaymentComplete
					) {
						onPaymentComplete(updatedPayment);
					}
				}

				return updatedPayment;
			} catch (err) {
				if (mountedRef.current) {
					handleError(err);
				}
				throw err;
			}
		},
		[clearError, handleError, onPaymentUpdate, onPaymentComplete]
	);

	/**
	 * Cancel a payment
	 */
	const cancelPayment = useCallback(
		async (
			transactionId: string,
			reason?: string
		): Promise<PaymentResponse> => {
			if (!clientRef.current) {
				throw new Error("Payment client not initialized");
			}

			try {
				setLoading(true);
				clearError();

				const cancelledPayment = await clientRef.current.cancelPayment(
					transactionId,
					reason
				);

				if (mountedRef.current) {
					setPayment(cancelledPayment);
					setLoading(false);

					if (onPaymentUpdate) {
						onPaymentUpdate(cancelledPayment);
					}

					// Stop polling since payment is cancelled
					if (pollTimeoutRef.current) {
						clearTimeout(pollTimeoutRef.current);
					}
				}

				return cancelledPayment;
			} catch (err) {
				if (mountedRef.current) {
					handleError(err);
				}
				throw err;
			}
		},
		[clearError, handleError, onPaymentUpdate]
	);

	/**
	 * Start polling for payment status updates
	 */
	const startPolling = useCallback(
		(transactionId: string) => {
			let pollAttempts = 0;

			const poll = async () => {
				if (!mountedRef.current || !clientRef.current) {
					return;
				}

				try {
					pollAttempts++;
					const updatedPayment =
						await clientRef.current.checkPaymentStatus(
							transactionId
						);

					if (mountedRef.current) {
						setPayment(updatedPayment);

						if (onPaymentUpdate) {
							onPaymentUpdate(updatedPayment);
						}

						// Check if payment is complete
						if (isPaymentFinal(updatedPayment.status)) {
							if (
								updatedPayment.status === "COMPLETED" &&
								onPaymentComplete
							) {
								onPaymentComplete(updatedPayment);
							}
							return; // Stop polling
						}

						// Continue polling if not exceeded max attempts
						if (pollAttempts < maxPollAttempts) {
							pollTimeoutRef.current = setTimeout(
								poll,
								pollInterval
							);
						} else {
							handleError({
								code: "POLLING_TIMEOUT",
								message: "Payment status polling timeout",
								transactionId,
							});
						}
					}
				} catch (err) {
					if (mountedRef.current) {
						handleError(err);
					}
				}
			};

			// Start polling
			pollTimeoutRef.current = setTimeout(poll, pollInterval);
		},
		[
			pollInterval,
			maxPollAttempts,
			onPaymentUpdate,
			onPaymentComplete,
			handleError,
		]
	);

	/**
	 * Stop polling
	 */
	const stopPolling = useCallback(() => {
		if (pollTimeoutRef.current) {
			clearTimeout(pollTimeoutRef.current);
			pollTimeoutRef.current = undefined;
		}
	}, []);

	/**
	 * Check if payment status is final
	 */
	const isPaymentFinal = useCallback((status: string): boolean => {
		return ["COMPLETED", "FAILED", "CANCELLED", "EXPIRED"].includes(status);
	}, []);

	/**
	 * Reset all state
	 */
	const reset = useCallback(() => {
		setPayment(null);
		setLoading(false);
		setError(null);
		stopPolling();
	}, [stopPolling]);

	/**
	 * Retry failed payment
	 */
	const retryPayment = useCallback(
		async (
			originalPaymentData: PaymentRequest
		): Promise<PaymentResponse> => {
			reset();
			return initiatePayment(originalPaymentData);
		},
		[reset, initiatePayment]
	);

	/**
	 * Get payment by transaction ID
	 */
	const getPayment = useCallback(
		async (transactionId: string): Promise<PaymentResponse> => {
			return checkPaymentStatus(transactionId);
		},
		[checkPaymentStatus]
	);

	/**
	 * Update configuration
	 */
	const updateConfig = useCallback((newConfig: Partial<SDKConfig>) => {
		if (clientRef.current) {
			clientRef.current.updateConfig(newConfig);
		}
	}, []);

	/**
	 * Health check
	 */
	const healthCheck = useCallback(async () => {
		if (!clientRef.current) {
			throw new Error("Payment client not initialized");
		}
		return clientRef.current.healthCheck();
	}, []);

	// Cleanup effect
	useEffect(() => {
		return () => {
			mountedRef.current = false;
			stopPolling();
		};
	}, [stopPolling]);

	return {
		// State
		payment,
		loading,
		error,
		providers,
		providersLoading,

		// Actions
		initiatePayment,
		checkPaymentStatus,
		cancelPayment,
		fetchProviders,
		reset,

		// Additional utilities
		// retryPayment,
		// getPayment,
		// updateConfig,
		// healthCheck,
		// startPolling,
		// stopPolling,
		// clearError,
	};
}

/**
 * Custom hook for handling payment callbacks
 */
export function usePaymentCallback(options: CallbackHandlerOptions = {}) {
	const {
		successCallback,
		errorCallback,
		cancelCallback,
		pollInterval = 2000,
		maxPollAttempts = 30,
	} = options;

	const [callbackData, setCallbackData] = useState<{
		type: "success" | "error" | "cancelled" | null;
		payment?: PaymentResponse;
		error?: PaymentError;
	}>({ type: null });

	/**
	 * Handle URL callback parameters
	 */
	const handleCallback = useCallback(
		(url: string = window.location.href) => {
			const urlParams = new URLSearchParams(new URL(url).search);

			const transactionId = urlParams.get("transactionId");
			const status = urlParams.get("status");
			const error = urlParams.get("error");

			if (error) {
				const errorData: PaymentError = {
					code: urlParams.get("errorCode") || "CALLBACK_ERROR",
					message: decodeURIComponent(error),
					transactionId: transactionId || undefined,
				};

				setCallbackData({ type: "error", error: errorData });

				if (errorCallback) {
					errorCallback(errorData);
				}
				return;
			}

			if (status === "cancelled") {
				setCallbackData({ type: "cancelled" });

				if (cancelCallback) {
					cancelCallback();
				}
				return;
			}

			if (transactionId && status === "success") {
				// For successful payments, we might want to fetch the full payment details
				// This would require the payment client, so we'll just call the success callback
				setCallbackData({ type: "success" });

				if (successCallback) {
					// Note: In a real implementation, you might want to fetch payment details here
					const mockPayment: PaymentResponse = {
						transactionId,
						status: "COMPLETED",
						statusMessage: "Payment completed successfully",
						provider: "UNKNOWN" as any,
						amount: { amount: 0, currency: "USD" },
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					};
					successCallback(mockPayment);
				}
			}
		},
		[successCallback, errorCallback, cancelCallback]
	);

	/**
	 * Listen for browser navigation events
	 */
	useEffect(() => {
		// Handle initial load
		handleCallback();

		// Handle browser navigation
		const handlePopState = () => {
			handleCallback();
		};

		window.addEventListener("popstate", handlePopState);

		return () => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, [handleCallback]);

	return {
		callbackData,
		handleCallback,
		clearCallback: () => setCallbackData({ type: null }),
	};
}
