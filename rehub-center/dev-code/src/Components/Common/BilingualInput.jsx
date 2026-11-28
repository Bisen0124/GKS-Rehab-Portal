import React from "react";
import { Input as ReactstrapInput } from "reactstrap";
import { useLang } from "../../contexts/LangContext";
import { transliterateTextToHindi } from "../../utils/hindiTranslator";

const SKIP_TYPING_NAMES = new Set([
  "email",
  "phone",
  "mobile",
  "secondary_phone",
  "whatsapp_no",
  "password",
  "aadhar_number",
  "aadhar",
  "uid",
  "genUID",
  "gks_id",
  "custom_code",
  "year",
  "age",
  "how_many_times",
  "days_of_sobriety",
  "patient_monthly_income",
  "family_monthly_income",
  "daily_expense_on_substance",
  "dependent_friends_count",
]);

/**
 * Drop-in replacement for reactstrap's <Input> that automatically enables
 * phonetic Hindi typing when the portal language is set to Hindi ("hi").
 */
const BilingualInput = React.forwardRef(function BilingualInput(props, ref) {
  const {
    type = "text",
    name,
    id,
    onChange,
    onBlur,
    readOnly,
    disabled,
    disableHindiTyping = false,
    ...rest
  } = props;

  const langCtx = useLang();
  const isHindiMode =
    !disableHindiTyping &&
    !readOnly &&
    !disabled &&
    langCtx?.lang === "hi" &&
    (type === "text" || type === "textarea") &&
    (!name || !SKIP_TYPING_NAMES.has(name));

  const emitSyntheticChange = (nextVal) => {
    if (typeof onChange === "function") {
      onChange({
        target: {
          name,
          id,
          value: nextVal,
          type,
        },
      });
    }
  };

  const handleChange = async (e) => {
    if (typeof onChange === "function") {
      onChange(e);
    }
    if (isHindiMode && e?.target?.value && /[A-Za-z]+[\s.,?!;:\n]$/.test(e.target.value)) {
      const rawVal = e.target.value;
      const converted = await transliterateTextToHindi(rawVal, { transliterateAll: false });
      if (converted !== rawVal) {
        emitSyntheticChange(converted);
      }
    }
  };

  const handleBlur = async (e) => {
    if (typeof onBlur === "function") {
      onBlur(e);
    }
    if (isHindiMode && e?.target?.value && /[A-Za-z]/.test(e.target.value)) {
      const rawVal = e.target.value;
      const converted = await transliterateTextToHindi(rawVal, { transliterateAll: true });
      if (converted !== rawVal) {
        emitSyntheticChange(converted);
      }
    }
  };

  return (
    <ReactstrapInput
      innerRef={ref}
      type={type}
      name={name}
      id={id}
      readOnly={readOnly}
      disabled={disabled}
      onChange={isHindiMode ? handleChange : onChange}
      onBlur={isHindiMode ? handleBlur : onBlur}
      {...rest}
    />
  );
});

export default BilingualInput;
