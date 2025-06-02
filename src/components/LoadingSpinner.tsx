/**
 * Loading Spinner Component
 * Reusable loading indicator with different sizes
 */

import clsx from "clsx";
import React from "react";
import "../styles/LoadingSpinner.css";

interface LoadingSpinnerProps {
	size?: "small" | "medium" | "large";
	color?: string;
	className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
	size = "medium",
	color,
	className,
}) => {
	return (
		<div
			className={clsx(
				"loading-spinner",
				`loading-spinner--${size}`,
				className
			)}
			style={color ? { color } : undefined}
			role="status"
			aria-label="Loading"
		>
			<svg
				className="loading-spinner__svg"
				viewBox="0 0 50 50"
				width="100%"
				height="100%"
			>
				<circle
					className="loading-spinner__circle"
					cx="25"
					cy="25"
					r="20"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeDasharray="31.416"
					strokeDashoffset="31.416"
				/>
			</svg>
		</div>
	);
};
