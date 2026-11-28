import { useEffect, useRef } from "react";
import { translateFormDataObject } from "../utils/hindiTranslator";

function getRecordSignature(data, fallback = "rec") {
  if (!data) return "";
  const obj = Array.isArray(data) ? data[0] : data;
  if (!obj || typeof obj !== "object") return fallback;
  return String(
    obj.id ??
      obj.pfa_id ??
      obj.fe_id ??
      obj.fpa_id ??
      obj.fda_id ??
      obj.ba_id ??
      obj.sud_id ??
      obj.gen_fam_id ??
      obj.brief_intervention_id ??
      obj.detox_id ??
      obj.discharge_id ??
      obj.bill_id ??
      obj.user_id ??
      obj.gks_id ??
      fallback
  );
}

/**
 * Translates Create form state whenever the user switches language (en <-> hi)
 * while the form/modal is open.
 */
export function useBilingualCreate(isOpen, formData, setFormData, lang) {
  const prevLangRef = useRef(lang);

  useEffect(() => {
    if (prevLangRef.current === lang) return;
    prevLangRef.current = lang;

    if (!isOpen || !formData || typeof setFormData !== "function") return;

    let cancelled = false;
    translateFormDataObject(formData, lang).then((translated) => {
      if (!cancelled && translated) {
        setFormData(translated);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [lang, isOpen]);
}

/**
 * Translates Edit / Readmission form state on modal open and on language switch.
 */
export function useBilingualEdit(isOpen, editData, setEditData, lang, prefix = "edit") {
  const lastKeyRef = useRef("");

  useEffect(() => {
    if (!isOpen || !editData || typeof setEditData !== "function") {
      if (!isOpen) lastKeyRef.current = "";
      return;
    }

    const sig = getRecordSignature(editData, prefix);
    const key = `${prefix}_${sig}_${lang}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    let cancelled = false;
    translateFormDataObject(editData, lang).then((translated) => {
      if (!cancelled && translated) {
        setEditData(translated);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [lang, isOpen, editData]);
}

/**
 * Translates View modal data from the original raw record on open and on language switch.
 */
export function useBilingualView(isOpen, viewData, setViewData, lang, prefix = "view") {
  const rawRef = useRef(null);
  const rawSigRef = useRef("");
  const lastKeyRef = useRef("");

  useEffect(() => {
    if (!isOpen || !viewData || typeof setViewData !== "function") {
      if (!isOpen) {
        rawRef.current = null;
        rawSigRef.current = "";
        lastKeyRef.current = "";
      }
      return;
    }

    const sig = getRecordSignature(viewData, prefix);
    if (!rawRef.current || rawSigRef.current !== sig) {
      rawRef.current = viewData;
      rawSigRef.current = sig;
    }

    const key = `${prefix}_${sig}_${lang}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    let cancelled = false;
    translateFormDataObject(rawRef.current, lang).then((translated) => {
      if (!cancelled && translated) {
        setViewData(translated);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [lang, isOpen, viewData]);
}
