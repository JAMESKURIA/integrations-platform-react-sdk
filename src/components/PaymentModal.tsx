/**
 * Payment Modal Component
 * Main modal component that orchestrates the payment flow
 */

import clsx from "clsx";
import React, {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { usePayment } from "../hooks/usePayment";
import "../styles/PaymentModal.css";
import {
	PaymentModalProps,
	PaymentModalRef,
	PaymentProvider,
	PaymentRequest,
} from "../types";
import { LoadingSpinner } from "./LoadingSpinner";
import { PaymentForm } from "./PaymentForm";
import { PaymentStatus } from "./PaymentStatus";

export const PaymentModal = forwardRef<PaymentModalRef, PaymentModalProps>(
	(
		{
			isOpen,
			onClose,
			onSuccess,
			onError,
			paymentData,
			config,
			theme,
			showProviderLogos = true,
			allowedProviders,
			excludedProviders,
			customization,
		},
		ref
	) => {
		const [currentStep, setCurrentStep] = useState<
			"form" | "processing" | "status"
		>("form");
		const [selectedProvider, setSelectedProvider] =
			useState<PaymentProvider | null>(null);
		const [isVisible, setIsVisible] = useState(false);

		const {
			payment,
			loading,
			error,
			providers,
			providersLoading,
			initiatePayment,
			cancelPayment,
			reset,
			fetchProviders,
		} = usePayment({
			config,
			autoFetchProviders: true,
			onPaymentUpdate: (payment) => {
				console.log("Payment updated:", payment);
			},
			onPaymentComplete: (payment) => {
				setCurrentStep("status");
				onSuccess(payment);
			},
			onPaymentError: (error) => {
				setCurrentStep("status");
				onError(error);
			},
		});

		// Filter providers based on allowedProviders and excludedProviders
		const filteredProviders = providers.filter((provider) => {
			if (
				allowedProviders &&
				!allowedProviders.includes(provider.code as PaymentProvider)
			) {
				return false;
			}
			if (
				excludedProviders &&
				excludedProviders.includes(provider.code as PaymentProvider)
			) {
				return false;
			}
			return provider.active;
		});

		// Handle modal visibility with animation
		useEffect(() => {
			if (isOpen) {
				setIsVisible(true);
				document.body.style.overflow = "hidden";
			} else {
				setIsVisible(false);
				document.body.style.overflow = "";
				// Reset state when modal closes
				setTimeout(() => {
					setCurrentStep("form");
					setSelectedProvider(null);
					reset();
				}, 300); // Wait for animation to complete
			}

			return () => {
				document.body.style.overflow = "";
			};
		}, [isOpen, reset]);

		// Imperative handle for ref
		useImperativeHandle(ref, () => ({
			openModal: () => setIsVisible(true),
			closeModal: () => {
				setIsVisible(false);
				onClose();
			},
			isOpen: isVisible,
		}));

		// Handle payment form submission
		const handlePaymentSubmit = useCallback(
			async (formPaymentData: PaymentRequest) => {
				try {
					setCurrentStep("processing");
					setSelectedProvider(formPaymentData.provider);
					await initiatePayment(formPaymentData);
				} catch (err) {
					console.error("Payment initiation failed:", err);
					setCurrentStep("status");
				}
			},
			[initiatePayment]
		);

		// Handle payment cancellation
		const handleCancel = useCallback(async () => {
			if (payment?.transactionId) {
				try {
					await cancelPayment(
						payment.transactionId,
						"User cancelled"
					);
				} catch (err) {
					console.error("Payment cancellation failed:", err);
				}
			}
			onClose();
		}, [payment, cancelPayment, onClose]);

		// Handle retry
		const handleRetry = useCallback(() => {
			setCurrentStep("form");
			setSelectedProvider(null);
			reset();
		}, [reset]);

		// Handle close
		const handleClose = useCallback(() => {
			if (currentStep === "processing" && payment?.transactionId) {
				// Show confirmation dialog for cancelling active payment
				const shouldCancel = window.confirm(
					"You have a payment in progress. Closing this modal will cancel the payment. Are you sure?"
				);
				if (shouldCancel) {
					handleCancel();
				}
			} else {
				onClose();
			}
		}, [currentStep, payment, handleCancel, onClose]);

		// Keyboard event handling
		useEffect(() => {
			const handleKeyDown = (event: KeyboardEvent) => {
				if (event.key === "Escape" && isVisible) {
					handleClose();
				}
			};

			if (isVisible) {
				document.addEventListener("keydown", handleKeyDown);
			}

			return () => {
				document.removeEventListener("keydown", handleKeyDown);
			};
		}, [isVisible, handleClose]);

		if (!isOpen && !isVisible) {
			return null;
		}

		const modalContent = (
			<div
				className={clsx(
					"payment-modal-overlay",
					isVisible && "payment-modal-overlay--visible"
				)}
				onClick={(e) => {
					if (e.target === e.currentTarget) {
						handleClose();
					}
				}}
				style={
					{
						"--payment-modal-primary-color":
							theme?.primaryColor || "#007bff",
						"--payment-modal-secondary-color":
							theme?.secondaryColor || "#6c757d",
						"--payment-modal-background-color":
							theme?.backgroundColor || "#ffffff",
						"--payment-modal-text-color":
							theme?.textColor || "#333333",
						"--payment-modal-border-color":
							theme?.borderColor || "#dee2e6",
						"--payment-modal-border-radius":
							theme?.borderRadius || "8px",
						"--payment-modal-font-size": theme?.fontSize || "14px",
						"--payment-modal-font-family":
							theme?.fontFamily ||
							"system-ui, -apple-system, sans-serif",
					} as React.CSSProperties
				}
			>
				<div
					className={clsx(
						"payment-modal",
						`payment-modal--${theme?.modalStyle || "default"}`,
						isVisible && "payment-modal--visible"
					)}
					onClick={(e) => e.stopPropagation()}
				>
					{/* Modal Header */}
					<div className="payment-modal__header">
						<h2 className="payment-modal__title">
							{customization?.title || "Complete Payment"}
						</h2>
						{customization?.subtitle && (
							<p className="payment-modal__subtitle">
								{customization.subtitle}
							</p>
						)}
						<button
							type="button"
							className="payment-modal__close"
							onClick={handleClose}
							aria-label="Close payment modal"
						>
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="currentColor"
							>
								<path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 0 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z" />
							</svg>
						</button>
					</div>

					{/* Modal Content */}
					<div className="payment-modal__content">
						{currentStep === "form" && (
							<PaymentForm
								onSubmit={handlePaymentSubmit}
								providers={filteredProviders}
								config={config}
								theme={theme}
								loading={loading}
								error={error?.message}
								customization={customization}
								initialData={paymentData}
								showProviderLogos={showProviderLogos}
							/>
						)}

						{currentStep === "processing" && (
							<div className="payment-modal__processing">
								<LoadingSpinner size="large" />
								<h3>Processing Payment</h3>
								<p>
									{selectedProvider === "MPESA" &&
										"Please check your phone for the M-Pesa prompt..."}
									{selectedProvider === "PAYPAL" &&
										"Redirecting to PayPal..."}
									{selectedProvider === "STRIPE" &&
										"Processing your card payment..."}
									{!["MPESA", "PAYPAL", "STRIPE"].includes(
										selectedProvider || ""
									) &&
										"Please wait while we process your payment..."}
								</p>
								<div className="payment-modal__processing-actions">
									<button
										type="button"
										className="payment-modal__button payment-modal__button--secondary"
										onClick={handleCancel}
									>
										Cancel Payment
									</button>
								</div>
							</div>
						)}

						{currentStep === "status" && (
							<PaymentStatus
								payment={payment!}
								error={error}
								onClose={onClose}
								onRetry={handleRetry}
								theme={theme}
								showTransactionDetails={true}
							/>
						)}
					</div>

					{/* Modal Footer */}
					{currentStep === "form" && (
						<div className="payment-modal__footer">
							<div className="payment-modal__security">
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11C15.4,11 16,11.4 16,12V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V12C8,11.4 8.4,11 9,11V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z" />
								</svg>
								<span>Secured by Integration Platform</span>
							</div>
						</div>
					)}
				</div>
			</div>
		);

		// Render modal using portal
		return createPortal(modalContent, document.body);
	}
);

PaymentModal.displayName = "PaymentModal";
