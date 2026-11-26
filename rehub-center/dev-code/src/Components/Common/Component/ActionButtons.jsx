import React from "react";

const VARIANT_CLASS_MAP = {
  view: "btn-action-view",
  edit: "btn-action-edit",
  create: "btn-action-create",
  check: "btn-action-create",
  print: "btn-action-create",
  delete: "btn-action-delete",
  refresh: "btn-action-info",
  disabled: "btn-action-disabled",
};

const renderActionIcon = (type) => {
  const svgProps = {
    xmlns: "http://www.w3.org/2000/svg",
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.1",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  switch (type) {
    case "edit":
      return (
        <svg {...svgProps} className="feather feather-edit">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    case "create":
      return (
        <svg {...svgProps} className="feather feather-plus-square">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case "delete":
      return (
        <svg {...svgProps} className="feather feather-trash-2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...svgProps} className="feather feather-refresh-ccw">
          <polyline points="1 4 1 10 7 10" />
          <polyline points="23 20 23 14 17 14" />
          <path d="M20.49 9A9 9 0 0 0 5.51 15M3.51 15A9 9 0 0 0 18.49 9" />
        </svg>
      );
    case "check":
      return (
        <svg {...svgProps} className="feather feather-check-circle">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case "print":
      return (
        <svg {...svgProps} className="feather feather-printer">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      );
    case "disabled":
      return (
        <svg {...svgProps} className="feather feather-alert-circle">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    case "view":
    default:
      return (
        <svg {...svgProps} className="feather feather-eye">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
};

/** Wrapper aligning table row action buttons cleanly in one horizontal row. */
export const ActionButtonsGroup = ({ children, className = "", style }) => (
  <div className={`gks-action-group ${className}`.trim()} style={style}>
    {children}
  </div>
);

/** Consistent square semantic action button for all DataTables and resource tables. */
export const TableActionButton = ({
  type = "view",
  onClick,
  title = "",
  disabled = false,
  className = "",
}) => {
  const isDisabled = Boolean(disabled) || type === "disabled";
  const variantClass = isDisabled
    ? "btn-action-disabled"
    : VARIANT_CLASS_MAP[type] || "btn-action-view";

  return (
    <button
      type="button"
      className={`btn btn-action-icon ${variantClass} ${className}`.trim()}
      title={title}
      aria-label={title}
      aria-disabled={isDisabled}
      onClick={(e) => {
        if (isDisabled) {
          e.preventDefault();
          return;
        }
        if (onClick) onClick(e);
      }}
    >
      {renderActionIcon(type)}
    </button>
  );
};
