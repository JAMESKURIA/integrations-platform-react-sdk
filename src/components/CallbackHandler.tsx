/**
 * Callback Handler Component
 * Handles payment callback URLs and provides status updates
 */

import React, { useCallback, useEffect, useState } from "react";
import { usePayment, usePaymentCallback } from "../hooks/usePayment";
import {
	CallbackHandlerOptions,
	PaymentCallback,
	PaymentError,
	PaymentResponse,
	SDKConfig,
} from "../types";
import { LoadingSpinner } from "./LoadingSpinner";
import { PaymentStatus } from "./PaymentStatus";

interface CallbackHandlerProps {
	config: SDKConfig;
	onCallback?: (callback: PaymentCallback) => void;
	onSuccess?: (payment: PaymentResponse) => void;
	onError?: (error: PaymentError) => void;
	onCancel?: () => void;
	options?: CallbackHandlerOptions;
	autoRedirect?: boolean;
	redirectDelay?: number;
	customLoadingComponent?: React.ReactNode;
	customSuccessComponent?: (payment: PaymentResponse) => React.ReactNode;
	customErrorComponent?: (error: PaymentError) => React.ReactNode;
}

export const CallbackHandler: React.FC<CallbackHandlerProps> = ({
	config,
	onCallback,
	onSuccess,
	onError,
	onCancel,
	options = {},
	autoRedirect = false,
	redirectDelay = 3000,
	customLoadingComponent,
	customSuccessComponent,
	customErrorComponent,
}) => {
	const [isProcessing, setIsProcessing] = useState(true);
	const [finalPayment, setFinalPayment] = useState<PaymentResponse | null>(
		null
	);
	const [finalError, setFinalError] = useState<PaymentError | null>(null);
	const [redirectCountdown, setRedirectCountdown] = useState<number | null>(
		null
	);

	const { payment, loading, error, checkPaymentStatus, reset } = usePayment({
		config,
		autoFetchProviders: false,
		onPaymentComplete: (payment) => {
			setFinalPayment(payment);
			setIsProcessing(false);

			const callbackData: PaymentCallback = {
				type: "success",
				payment,
			};

			if (onCallback) onCallback(callbackData);
			if (onSuccess) onSuccess(payment);

			if (autoRedirect) {
				startRedirectCountdown();
			}
		},
		onPaymentError: (error) => {
			setFinalError(error);
			setIsProcessing(false);

			const callbackData: PaymentCallback = {
				type: "error",
				error,
			};

			if (onCallback) onCallback(callbackData);
			if (onError) onError(error);
		},
	});

	const { callbackData, handleCallback } = usePaymentCallback({
		successCallback: options.successCallback,
		errorCallback: options.errorCallback,
		cancelCallback: options.cancelCallback,
		pollInterval: options.pollInterval,
		maxPollAttempts: options.maxPollAttempts,
	});

	// Handle URL parameters and fetch payment status
	useEffect(() => {
		const processCallback = async () => {
			try {
				const urlParams = new URLSearchParams(window.location.search);
				const transactionId =
					urlParams.get("transactionId") ||
					urlParams.get("transaction_id");
				const status = urlParams.get("status");
				const errorParam = urlParams.get("error");

				// Handle immediate error from URL
				if (errorParam) {
					const error: PaymentError = {
						code:
							urlParams.get("errorCode") ||
							urlParams.get("error_code") ||
							"CALLBACK_ERROR",
						message: decodeURIComponent(errorParam),
						transactionId: transactionId || undefined,
					};

					setFinalError(error);
					setIsProcessing(false);

					if (onCallback) {
						onCallback({ type: "error", error });
					}
					if (onError) {
						onError(error);
					}
					return;
				}

				// Handle cancellation
				if (status === "cancelled" || status === "canceled") {
					setIsProcessing(false);

					if (onCallback) {
						onCallback({ type: "cancelled" });
					}
					if (onCancel) {
						onCancel();
					}
					return;
				}

				// Fetch payment status if transaction ID is available
				if (transactionId) {
					try {
						const paymentResponse = await checkPaymentStatus(
							transactionId
						);

						// Payment status will be handled by the usePayment hook callbacks
						// which will update finalPayment or finalError accordingly
					} catch (err) {
						const error: PaymentError = {
							code: "PAYMENT_STATUS_ERROR",
							message: "Failed to retrieve payment status",
							transactionId,
						};

						setFinalError(error);
						setIsProcessing(false);

						if (onCallback) {
							onCallback({ type: "error", error });
						}
						if (onError) {
							onError(error);
						}
					}
				} else {
					// No transaction ID found
					const error: PaymentError = {
						code: "MISSING_TRANSACTION_ID",
						message: "No transaction ID found in callback URL",
					};

					setFinalError(error);
					setIsProcessing(false);

					if (onCallback) {
						onCallback({ type: "error", error });
					}
					if (onError) {
						onError(error);
					}
				}
			} catch (err) {
				const error: PaymentError = {
					code: "CALLBACK_PROCESSING_ERROR",
					message: "Failed to process payment callback",
				};

				setFinalError(error);
				setIsProcessing(false);

				if (onCallback) {
					onCallback({ type: "error", error });
				}
				if (onError) {
					onError(error);
				}
			}
		};

		processCallback();
	}, []);

	// Handle redirect countdown
	const startRedirectCountdown = useCallback(() => {
		setRedirectCountdown(Math.ceil(redirectDelay / 1000));

		const interval = setInterval(() => {
			setRedirectCountdown((prev) => {
				if (prev === null || prev <= 1) {
					clearInterval(interval);
					// Redirect to parent window or specified URL
					if (window.opener) {
						window.close();
					} else {
						window.history.back();
					}
					return null;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [redirectDelay]);

	// Handle manual close
	const handleClose = useCallback(() => {
		if (window.opener) {
			// If opened in popup, close the popup
			window.close();
		} else {
			// If in same window, go back
			window.history.back();
		}
	}, []);

	// Handle retry
	const handleRetry = useCallback(() => {
		reset();
		setFinalPayment(null);
		setFinalError(null);
		setIsProcessing(true);
		setRedirectCountdown(null);

		// Reload the page to restart the callback process
		window.location.reload();
	}, [reset]);

	// Render loading state
	if (isProcessing || loading) {
		if (customLoadingComponent) {
			return <>{customLoadingComponent}</>;
		}

		return (
			<div className="callback-handler">
				<div className="callback-handler__loading">
					<LoadingSpinner size="large" />
					<h2>Processing Payment</h2>
					<p>Please wait while we verify your payment status...</p>
				</div>
			</div>
		);
	}

	// Render success state
	if (finalPayment) {
		if (customSuccessComponent) {
			return <>{customSuccessComponent(finalPayment)}</>;
		}

		return (
			<div className="callback-handler">
				<PaymentStatus
					payment={finalPayment}
					onClose={handleClose}
					showTransactionDetails={true}
				/>

				{autoRedirect && redirectCountdown !== null && (
					<div className="callback-handler__redirect-notice">
						<p>
							This window will close automatically in{" "}
							{redirectCountdown} seconds...
						</p>
						<button
							type="button"
							onClick={() => setRedirectCountdown(null)}
							className="callback-handler__cancel-redirect"
						>
							Cancel Auto-Close
						</button>
					</div>
				)}
			</div>
		);
	}

	// Render error state
	if (finalError || error) {
		const displayError = finalError || error;

		if (customErrorComponent && displayError) {
			return <>{customErrorComponent(displayError)}</>;
		}

		return (
			<div className="callback-handler">
				<PaymentStatus
					payment={payment}
					error={displayError}
					onClose={handleClose}
					onRetry={handleRetry}
					showTransactionDetails={true}
				/>
			</div>
		);
	}

	// Render cancelled state
	if (callbackData.type === "cancelled") {
		return (
			<div className="callback-handler">
				<div className="callback-handler__cancelled">
					<div className="callback-handler__icon">❌</div>
					<h2>Payment Cancelled</h2>
					<p>Your payment was cancelled and no charges were made.</p>
					<div className="callback-handler__actions">
						<button
							type="button"
							onClick={handleRetry}
							className="callback-handler__button callback-handler__button--primary"
						>
							Try Again
						</button>
						<button
							type="button"
							onClick={handleClose}
							className="callback-handler__button callback-handler__button--secondary"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Default fallback
	return (
		<div className="callback-handler">
			<div className="callback-handler__unknown">
				<div className="callback-handler__icon">❓</div>
				<h2>Unknown Payment Status</h2>
				<p>
					We couldn't determine the status of your payment. Please try
					again or contact support.
				</p>
				<div className="callback-handler__actions">
					<button
						type="button"
						onClick={handleRetry}
						className="callback-handler__button callback-handler__button--primary"
					>
						Check Again
					</button>
					<button
						type="button"
						onClick={handleClose}
						className="callback-handler__button callback-handler__button--secondary"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};
