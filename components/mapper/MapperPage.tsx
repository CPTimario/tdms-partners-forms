"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type PointerEvent,
} from "react";
import { ClipboardCopy, Copy, Move, Save } from "lucide-react";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Slider from "@mui/material/Slider";
import Button from "@mui/material/Button";
import { getTemplateCoordinates } from "@/lib/pdf-coordinates";
import type {
  MembershipType,
} from "@/lib/support-form";
import type {
  CheckboxConfig,
  TemplateCoordinates,
  TextFieldConfig,
} from "@/types/pdf-form";
import { PDFRenderer } from "./PDFRenderer";
import styles from "./MapperPage.module.css";

const MM_TO_POINTS = 2.834645669;
const PAGE_WIDTH_PT = 612;
const PAGE_HEIGHT_PT = 252;
const PAGE_WIDTH_MM = PAGE_WIDTH_PT / MM_TO_POINTS;
const PAGE_HEIGHT_MM = PAGE_HEIGHT_PT / MM_TO_POINTS;

const PAGE_1_FIELDS: Array<keyof TemplateCoordinates> = [
  "partnerName",
  "emailAddress",
  "mobileNumber",
  "localChurch",
  "missionaryName",
  "amount",
  "nation",
  "travelDateMonth",
  "travelDateDay",
  "travelDateYear",
  "sendingChurch",
  "consentCheckbox",
];

const PAGE_2_FIELDS: Array<keyof TemplateCoordinates> = [
  "unableToGoTeamFund",
  "unableToGoGeneralFund",
  "reroutedRetain",
  "reroutedGeneralFund",
  "canceledGeneralFund",
  "partnerSignature",
  "partnerSignaturePrintedName",
];

const TEMPLATE_PDF_PATH: Record<MembershipType, string> = {
  victory: "/tdms-forms/pic-saf-victory.pdf",
  nonVictory: "/tdms-forms/pic-saf-non-victory.pdf",
};

type MapperPoint = {
  xMm: number;
  yMm: number;
};

type EditableFieldConfig = TextFieldConfig | CheckboxConfig;

type DragState = {
  field: keyof TemplateCoordinates;
  membershipType: MembershipType;
  offsetX: number;
  offsetY: number;
};

type ResizeState = {
  field: keyof TemplateCoordinates;
  membershipType: MembershipType;
  leftX: number;
  bottomY: number;
};

const DEFAULT_FIELD_BOX_DIMENSIONS: Partial<Record<keyof TemplateCoordinates, { width: number; height: number }>> = {
  partnerName: { width: 46, height: 7 },
  emailAddress: { width: 50, height: 7 },
  mobileNumber: { width: 34, height: 7 },
  localChurch: { width: 28, height: 7 },
  missionaryName: { width: 42, height: 7 },
  amount: { width: 18, height: 7 },
  nation: { width: 22, height: 7 },
  travelDateMonth: { width: 8, height: 7 },
  travelDateDay: { width: 8, height: 7 },
  travelDateYear: { width: 10, height: 7 },
  sendingChurch: { width: 36, height: 7 },
  consentCheckbox: { width: 5, height: 5 },
  unableToGoTeamFund: { width: 5, height: 5 },
  unableToGoGeneralFund: { width: 5, height: 5 },
  reroutedRetain: { width: 5, height: 5 },
  reroutedGeneralFund: { width: 5, height: 5 },
  canceledGeneralFund: { width: 5, height: 5 },
  partnerSignaturePrintedName: { width: 38, height: 6 },
};

function roundMm(value: number) {
  return Number(value.toFixed(2));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function cloneTemplateCoordinates(membershipType: MembershipType): TemplateCoordinates {
  return JSON.parse(JSON.stringify(getTemplateCoordinates(membershipType))) as TemplateCoordinates;
}

function toSnippet(field: keyof TemplateCoordinates, config: unknown) {
  if (!config || typeof config !== "object") {
    return `${field}: undefined,`;
  }

  return `${field}: ${JSON.stringify(config, null, 2)},`;
}

function isEditableFieldConfig(config: unknown): config is EditableFieldConfig {
  return Boolean(
    config &&
      typeof config === "object" &&
      "x" in config &&
      "y" in config,
  );
}

export function MapperPage() {
  const [membershipType, setMembershipType] = useState<MembershipType>("victory");
  const [pageNumber, setPageNumber] = useState<1 | 2>(1);
  const [zoom, setZoom] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedField, setSelectedField] = useState<keyof TemplateCoordinates>("partnerName");
  const [lastPoint, setLastPoint] = useState<MapperPoint | null>(null);
  const [draftCoordinates, setDraftCoordinates] = useState<Record<MembershipType, TemplateCoordinates>>(() => ({
    victory: cloneTemplateCoordinates("victory"),
    nonVictory: cloneTemplateCoordinates("nonVictory"),
  }));
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const dragMovedRef = useRef(false);
  const draftCoordinatesRef = useRef(draftCoordinates);

  useEffect(() => {
    draftCoordinatesRef.current = draftCoordinates;
  }, [draftCoordinates]);

  useEffect(() => {
    // Defer hydration flag update to avoid synchronous setState inside effect
    const id = window.setTimeout(() => setIsHydrated(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  const templateCoordinates = draftCoordinates[membershipType];

  const currentFieldKeys = pageNumber === 1 ? PAGE_1_FIELDS : PAGE_2_FIELDS;
  const activeSelectedField = currentFieldKeys.includes(selectedField)
    ? selectedField
    : currentFieldKeys[0];

  const mappedFields = useMemo<Array<{ key: keyof TemplateCoordinates; config: EditableFieldConfig }>>(
    () =>
      currentFieldKeys.reduce<Array<{ key: keyof TemplateCoordinates; config: EditableFieldConfig }>>(
        (acc, key) => {
          const config = templateCoordinates[key];
          if (isEditableFieldConfig(config)) {
            acc.push({ key, config });
          }
          return acc;
        },
        [],
      ),
    [currentFieldKeys, templateCoordinates],
  );

  const selectedConfig = templateCoordinates[activeSelectedField];
  const canvasWidth = PAGE_WIDTH_PT * zoom;
  const canvasHeight = PAGE_HEIGHT_PT * zoom;

  const getFieldDimensions = useCallback((field: keyof TemplateCoordinates, config: EditableFieldConfig) => {
    const fallback = DEFAULT_FIELD_BOX_DIMENSIONS[field] ?? { width: 24, height: 6 };

    return {
      width: config.width ?? fallback.width,
      height: config.height ?? fallback.height,
    };
  }, []);

  const updateFieldConfig = useCallback((
    field: keyof TemplateCoordinates,
    updater: (config: EditableFieldConfig) => EditableFieldConfig,
    nextMembershipType: MembershipType = membershipType,
  ) => {
    setDraftCoordinates((previous) => {
      const config = previous[nextMembershipType][field];
      if (!isEditableFieldConfig(config)) {
        return previous;
      }

      return {
        ...previous,
        [nextMembershipType]: {
          ...previous[nextMembershipType],
          [field]: updater(config),
        },
      };
    });
  }, [membershipType]);

  const updateFieldDimensions = useCallback((
    field: keyof TemplateCoordinates,
    widthMm: number,
    heightMm: number,
    nextMembershipType: MembershipType = membershipType,
  ) => {
    const config = draftCoordinatesRef.current[nextMembershipType][field];
    if (!isEditableFieldConfig(config)) {
      return;
    }

    const minWidth = 1;
    const minHeight = 1;
    const maxWidth = PAGE_WIDTH_MM - config.x;
    const maxHeight = PAGE_HEIGHT_MM - config.y;

    updateFieldConfig(
      field,
      (currentConfig) => ({
        ...currentConfig,
        width: roundMm(clamp(widthMm, minWidth, Math.max(minWidth, maxWidth))),
        height: roundMm(clamp(heightMm, minHeight, Math.max(minHeight, maxHeight))),
      }),
      nextMembershipType,
    );
  }, [membershipType, updateFieldConfig]);

  const setFieldPosition = useCallback((
    field: keyof TemplateCoordinates,
    xMm: number,
    yMm: number,
    nextMembershipType: MembershipType = membershipType,
  ) => {
    const config = draftCoordinatesRef.current[nextMembershipType][field];
    if (!isEditableFieldConfig(config)) {
      return;
    }

    const dimensions = getFieldDimensions(field, config);
    updateFieldConfig(
      field,
      (currentConfig) => ({
        ...currentConfig,
        x: roundMm(clamp(xMm, 0, PAGE_WIDTH_MM - dimensions.width)),
        y: roundMm(clamp(yMm, 0, PAGE_HEIGHT_MM - dimensions.height)),
      }),
      nextMembershipType,
    );
  }, [getFieldDimensions, membershipType, updateFieldConfig]);

  const moveSelectedFieldBy = useCallback((deltaX: number, deltaY: number) => {
    const config = templateCoordinates[activeSelectedField];
    if (!isEditableFieldConfig(config)) {
      return;
    }

    setFieldPosition(activeSelectedField, config.x + deltaX, config.y + deltaY);
  }, [activeSelectedField, setFieldPosition, templateCoordinates]);

  const getPointFromEvent = (clientX: number, clientY: number) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }

    const xPt = (clientX - rect.left) / zoom;
    const yPtFromBottom = (rect.height - (clientY - rect.top)) / zoom;

    return {
      xPt,
      yPtFromBottom,
    };
  };

  const placeSelectedFieldAtPoint = useCallback((xPt: number, yPtFromBottom: number) => {
    const config = templateCoordinates[activeSelectedField];
    if (!isEditableFieldConfig(config)) {
      return;
    }

    const dimensions = getFieldDimensions(activeSelectedField, config);
    const xMm = xPt / MM_TO_POINTS - dimensions.width / 2;
    const yMm = yPtFromBottom / MM_TO_POINTS - dimensions.height / 2;

    setFieldPosition(activeSelectedField, xMm, yMm);
  }, [activeSelectedField, getFieldDimensions, setFieldPosition, templateCoordinates]);

  const handleCanvasClick: MouseEventHandler<HTMLDivElement> = (event) => {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }

    const point = getPointFromEvent(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    surfaceRef.current?.focus();

    setLastPoint({
      xMm: roundMm(point.xPt / MM_TO_POINTS),
      yMm: roundMm(point.yPtFromBottom / MM_TO_POINTS),
    });

    placeSelectedFieldAtPoint(point.xPt, point.yPtFromBottom);
  };

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      dragMovedRef.current = true;

      const config = draftCoordinatesRef.current[dragState.membershipType][dragState.field];
      if (!isEditableFieldConfig(config)) {
        return;
      }

      const dimensions = getFieldDimensions(dragState.field, config);
      const leftPt = (event.clientX - rect.left - dragState.offsetX) / zoom;
      const topPt = (event.clientY - rect.top - dragState.offsetY) / zoom;
      const nextX = leftPt / MM_TO_POINTS;
      const nextY = PAGE_HEIGHT_MM - topPt / MM_TO_POINTS - dimensions.height;

      setFieldPosition(dragState.field, nextX, nextY, dragState.membershipType);
    };

    const handlePointerUp = () => {
      setDragState(null);
      window.setTimeout(() => {
        dragMovedRef.current = false;
      }, 0);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragState, getFieldDimensions, setFieldPosition, zoom]);

  useEffect(() => {
    if (!resizeState) {
      return;
    }

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      dragMovedRef.current = true;

      const widthPx = event.clientX - rect.left - resizeState.leftX;
      const heightPx = resizeState.bottomY - (event.clientY - rect.top);
      const widthMm = widthPx / (MM_TO_POINTS * zoom);
      const heightMm = heightPx / (MM_TO_POINTS * zoom);

      updateFieldDimensions(resizeState.field, widthMm, heightMm, resizeState.membershipType);
    };

    const handlePointerUp = () => {
      setResizeState(null);
      window.setTimeout(() => {
        dragMovedRef.current = false;
      }, 0);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [resizeState, updateFieldDimensions, zoom]);

  const handleSaveCoordinates = async () => {
    try {
      setSaveStatus("Saving...");
      const response = await fetch("/api/mapper/coordinates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates: draftCoordinates,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage =
          payload && typeof payload.error === "string"
            ? payload.error
            : `Save failed (${response.status})`;
        setSaveStatus(errorMessage);
        return;
      }

      setSaveStatus("Saved to lib/pdf-coordinates.ts");
    } catch {
      setSaveStatus("Save failed. Check the dev server logs.");
    }
  };

  const handleSurfaceKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    const step = event.shiftKey ? 1 : 0.25;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveSelectedFieldBy(-step, 0);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveSelectedFieldBy(step, 0);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSelectedFieldBy(0, step);
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSelectedFieldBy(0, -step);
    }
  };

  const pageSnippet = mappedFields
    .map((entry) => toSnippet(entry.key, entry.config))
    .join("\n");

  const pdfPath = TEMPLATE_PDF_PATH[membershipType];

  const selectedDimensions =
    isEditableFieldConfig(selectedConfig)
      ? getFieldDimensions(activeSelectedField, selectedConfig)
      : { width: 0, height: 0 };

  if (!isHydrated) {
    return (
      <main className={styles.shell}>
        <section className={styles.card}>
          <h1 className={styles.title}>PDF Mapper (Development Only)</h1>
          <p className={styles.subtitle}>Loading mapper...</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <h1 className={styles.title}>PDF Mapper (Development Only)</h1>
        <p className={styles.subtitle}>
          Position boxes directly on top of the rendered template. Click to place, drag to move, and use arrow keys
          to nudge the selected field.
        </p>

        <div className={styles.controls}>
          <label className={styles.label}>
            Template
            <TextField
              select
              className={styles.select}
              value={membershipType}
              disabled={!isHydrated}
              size="small"
              onChange={(event) => {
                setMembershipType(event.target.value as MembershipType);
              }}
            >
              <MenuItem value="victory">Victory</MenuItem>
              <MenuItem value="nonVictory">Non-Victory</MenuItem>
            </TextField>
          </label>

          <label className={styles.label}>
            Page
            <TextField
              select
              className={styles.select}
              value={pageNumber}
              disabled={!isHydrated}
              size="small"
              onChange={(event) => {
                setPageNumber(Number(event.target.value) as 1 | 2);
              }}
            >
              <MenuItem value={1}>Page 1</MenuItem>
              <MenuItem value={2}>Page 2</MenuItem>
            </TextField>
          </label>

          <label className={styles.label}>
            Zoom: {zoom.toFixed(2)}x
            <Slider
              className={styles.range}
              min={0.8}
              max={2}
              step={0.1}
              value={zoom}
              disabled={!isHydrated}
              onChange={(_, v) => {
                setZoom(Number(v));
              }}
              valueLabelDisplay="auto"
            />
          </label>
        </div>

        <div className={styles.layout}>
          <div className={styles.canvasWrap}>
            <div
              ref={surfaceRef}
              className={styles.canvas}
              data-testid="mapper-surface"
              style={{ width: canvasWidth, height: canvasHeight }}
              onClick={handleCanvasClick}
              onKeyDown={handleSurfaceKeyDown}
              tabIndex={0}
            >
              <PDFRenderer
                pdfPath={pdfPath}
                pageNumber={pageNumber}
                width={PAGE_WIDTH_PT}
                height={PAGE_HEIGHT_PT}
                zoom={zoom}
              />
              {mappedFields.map(({ key, config }) => {
                const dimensions = getFieldDimensions(key, config);
                const x = config.x * MM_TO_POINTS * zoom;
                const y = canvasHeight - (config.y + dimensions.height) * MM_TO_POINTS * zoom;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.fieldBox} ${activeSelectedField === key ? styles.fieldBoxSelected : ""}`}
                    data-testid={`mapper-box-${key}`}
                    style={{
                      left: x,
                      top: y,
                      width: dimensions.width * MM_TO_POINTS * zoom,
                      height: dimensions.height * MM_TO_POINTS * zoom,
                    }}
                    aria-label={`Select ${key}`}
                    onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setSelectedField(key);
                      surfaceRef.current?.focus();
                      dragMovedRef.current = false;

                      const rect = event.currentTarget.getBoundingClientRect();
                      setDragState({
                        field: key,
                        membershipType,
                        offsetX: event.clientX - rect.left,
                        offsetY: event.clientY - rect.top,
                      });
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedField(key);
                      surfaceRef.current?.focus();
                    }}
                  >
                    <span className={styles.fieldBoxLabel}>{key}</span>
                    {activeSelectedField === key ? (
                      <span
                        className={styles.resizeHandle}
                        data-testid={`mapper-resize-${key}`}
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setSelectedField(key);
                          surfaceRef.current?.focus();

                          dragMovedRef.current = false;

                          const leftX = config.x * MM_TO_POINTS * zoom;
                          const bottomY = canvasHeight - config.y * MM_TO_POINTS * zoom;
                          setResizeState({
                            field: key,
                            membershipType,
                            leftX,
                            bottomY,
                          });
                        }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <aside className={styles.panel}>
            <div>
              <strong>Last click (mm)</strong>
              <p data-testid="mapper-last-click">
                {lastPoint ? `x: ${lastPoint.xMm}, y: ${lastPoint.yMm}` : "Click the template to capture a point."}
              </p>
            </div>

            <div>
              <strong>Fields on page {pageNumber}</strong>
              <ul className={styles.list}>
                {mappedFields.map(({ key, config }) => (
                  <li key={key}>
                    <Button
                      className={`${styles.listButton} ${activeSelectedField === key ? styles.listButtonActive : ""}`}
                      onClick={() => {
                        setSelectedField(key);
                        surfaceRef.current?.focus();
                      }}
                      type="button"
                      variant="text"
                    >
                      {key}: x {config.x}, y {config.y}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <strong>Selected field metrics</strong>
              {isEditableFieldConfig(selectedConfig) ? (
                <div className={styles.metricGrid}>
                  <label className={styles.metricLabel}>
                    X (mm)
                    <TextField
                      className={styles.metricInput}
                      size="small"
                      type="number"
                      inputProps={{ step: "0.1", "data-testid": "mapper-x-input" }}
                      value={String(selectedConfig.x)}
                      onChange={(event) => {
                        setFieldPosition(activeSelectedField, Number((event.target as HTMLInputElement).value), selectedConfig.y);
                      }}
                    />
                  </label>
                  <label className={styles.metricLabel}>
                    Y (mm)
                    <TextField
                      className={styles.metricInput}
                      size="small"
                      type="number"
                      inputProps={{ step: "0.1", "data-testid": "mapper-y-input" }}
                      value={String(selectedConfig.y)}
                      onChange={(event) => {
                        setFieldPosition(activeSelectedField, selectedConfig.x, Number((event.target as HTMLInputElement).value));
                      }}
                    />
                  </label>
                  <label className={styles.metricLabel}>
                    Width (mm)
                    <TextField
                      className={styles.metricInput}
                      size="small"
                      type="number"
                      inputProps={{ step: "0.1", "data-testid": "mapper-width-input" }}
                      value={String(selectedConfig.width ?? selectedDimensions.width)}
                      onChange={(event) => {
                        updateFieldDimensions(
                          activeSelectedField,
                          Number((event.target as HTMLInputElement).value),
                          selectedConfig.height ?? selectedDimensions.height,
                        );
                      }}
                    />
                  </label>
                  <label className={styles.metricLabel}>
                    Height (mm)
                    <TextField
                      className={styles.metricInput}
                      size="small"
                      type="number"
                      inputProps={{ step: "0.1", "data-testid": "mapper-height-input" }}
                      value={String(selectedConfig.height ?? selectedDimensions.height)}
                      onChange={(event) => {
                        updateFieldDimensions(
                          activeSelectedField,
                          selectedConfig.width ?? selectedDimensions.width,
                          Number((event.target as HTMLInputElement).value),
                        );
                      }}
                    />
                  </label>
                </div>
              ) : null}
            </div>

            <div>
              <strong>Selected field snippet</strong>
              <p data-testid="mapper-selected-field">{activeSelectedField}</p>
              <textarea
                className={styles.output}
                readOnly
                rows={6}
                value={toSnippet(activeSelectedField, selectedConfig)}
              />
              <Button
                className={styles.button}
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(toSnippet(activeSelectedField, selectedConfig));
                }}
                startIcon={<Copy size={16} aria-hidden="true" />}
                variant="outlined"
              >
                Copy Selected Field Snippet
              </Button>
            </div>

            <div>
              <strong>Current page snippets</strong>
              <textarea className={styles.output} readOnly rows={8} value={pageSnippet} />
              <Button
                className={styles.button}
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(pageSnippet);
                }}
                startIcon={<ClipboardCopy size={16} aria-hidden="true" />}
                variant="outlined"
              >
                Copy Page Snippets
              </Button>
            </div>

            <div>
              <strong>Persist coordinates</strong>
              <p>Save current mapper coordinates directly into app source (development only).</p>
              <Button className={styles.button} type="button" onClick={handleSaveCoordinates} startIcon={<Save size={16} aria-hidden="true" />} variant="contained">
                Save Coordinates to Source
              </Button>
              <p data-testid="mapper-save-status">{saveStatus || "Not saved in this session."}</p>
            </div>

            <div>
              <strong>Move controls</strong>
              <p>
                <Move size={14} aria-hidden="true" className={styles.inlineIcon} />
                Use drag and drop for coarse movement. Use arrow keys for 0.25mm nudges and Shift + arrow for 1mm.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
