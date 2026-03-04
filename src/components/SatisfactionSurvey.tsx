import React, { useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { realtimeDb } from "../firebase/Firebase";
import { ref, push } from "firebase/database";

// ─── Animations ──────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ─── Styled Components ────────────────────────────────────────────────────────

const SurveyWrapper = styled.div`
  max-width: 760px;
  margin: 0 auto;
  padding: 30px 20px 50px;
  font-family: "Arial", sans-serif;
  animation: ${fadeIn} 0.5s ease;
`;

const SurveyTitle = styled.h1`
  text-align: center;
  font-size: 1.8rem;
  color: #000;
  margin-bottom: 4px;
`;

const SurveySubtitle = styled.p`
  text-align: center;
  color: #555;
  font-size: 0.95rem;
  margin-bottom: 30px;
`;

const SectionTitle = styled.h2`
  font-size: 1.15rem;
  color: #fff;
  background-color: #000;
  padding: 10px 16px;
  border-radius: 6px;
  margin: 28px 0 16px;
`;

const QuestionBlock = styled.div`
  margin-bottom: 22px;
`;

const QuestionLabel = styled.label`
  display: block;
  font-size: 0.97rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
`;

const StarRow = styled.div`
  display: flex;
  gap: 8px;
`;

const StarButton = styled.button<{ selected: boolean }>`
  background: none;
  border: 2px solid ${(p) => (p.selected ? "#f0a500" : "#ccc")};
  border-radius: 50%;
  width: 38px;
  height: 38px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
  background-color: ${(p) => (p.selected ? "#fff3cd" : "transparent")};

  &:hover {
    border-color: #f0a500;
    background-color: #fff3cd;
  }
`;

const StarLabel = styled.span`
  font-size: 0.78rem;
  color: #888;
  align-self: center;
`;

const RadioGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const RadioOption = styled.label<{ selected: boolean }>`
  cursor: pointer;
  padding: 7px 14px;
  border-radius: 20px;
  border: 2px solid ${(p) => (p.selected ? "#000" : "#ccc")};
  background-color: ${(p) => (p.selected ? "#000" : "#fff")};
  color: ${(p) => (p.selected ? "#fff" : "#333")};
  font-size: 0.9rem;
  transition: all 0.2s;

  &:hover {
    border-color: #000;
  }

  input {
    display: none;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const CheckboxOption = styled.label<{ selected: boolean }>`
  cursor: pointer;
  padding: 7px 14px;
  border-radius: 20px;
  border: 2px solid ${(p) => (p.selected ? "#007bff" : "#ccc")};
  background-color: ${(p) => (p.selected ? "#007bff" : "#fff")};
  color: ${(p) => (p.selected ? "#fff" : "#333")};
  font-size: 0.9rem;
  transition: all 0.2s;

  &:hover {
    border-color: #007bff;
  }

  input {
    display: none;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 90px;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.95rem;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const TextInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.95rem;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const SubmitButton = styled.button`
  display: block;
  width: 100%;
  max-width: 280px;
  margin: 36px auto 0;
  padding: 14px;
  background-color: #000;
  color: #fff;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #333;
  }

  &:disabled {
    background-color: #888;
    cursor: not-allowed;
  }
`;

const SuccessCard = styled.div`
  text-align: center;
  padding: 50px 30px;
  animation: ${fadeIn} 0.5s ease;
`;

const SuccessIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 16px;
`;

const SuccessTitle = styled.h2`
  font-size: 1.6rem;
  color: #000;
  margin-bottom: 8px;
`;

const SuccessText = styled.p`
  color: #555;
  font-size: 1rem;
`;

const ErrorMsg = styled.p`
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 4px;
`;

const RequiredMark = styled.span`
  color: #dc3545;
  margin-left: 2px;
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SurveyData {
  // Sección 1 – Perfil
  memberType: string;
  usageMonths: string;
  mainActivity: string[];
  visitFrequency: string;

  // Sección 2 – Instalaciones
  cleanlinessRating: number;
  equipmentRating: number;
  spaceRating: number;
  lockerRating: number;

  // Sección 3 – Actividades y coaches
  classQualityRating: number;
  coachKnowledgeRating: number;
  coachAttitudeRating: number;
  scheduleVarietyRating: number;

  // Sección 4 – Sistema digital (app / consulta de membresía)
  systemEaseRating: number;
  membershipCheckRating: number;
  notificationsRating: number;
  usesSystem: string;

  // Sección 5 – Precios y planes
  priceValueRating: number;
  plansVarietyRating: number;
  paymentProcessRating: number;

  // Sección 6 – Experiencia general
  overallRating: number;
  recommendRating: number;
  staffAttentionRating: number;

  // Sección 7 – Mejoras
  improvementAreas: string[];
  newActivities: string[];
  suggestions: string;
  bestAspect: string;

  // Metadata
  submittedAt: string;
}

type SurveyErrors = Partial<Record<keyof SurveyData, string>>;

// ─── Constants ────────────────────────────────────────────────────────────────

const STAR_LABELS: Record<number, string> = {
  1: "Muy malo",
  2: "Malo",
  3: "Regular",
  4: "Bueno",
  5: "Excelente",
};

const ACTIVITIES = [
  "Gym",
  "MMA",
  "Kick Boxing",
  "Wrestling",
  "Crossfit",
  "Box",
  "Kick Boxing Kids",
  "Visita / Clase suelta",
];

const IMPROVEMENT_AREAS = [
  "Equipamiento",
  "Limpieza",
  "Horarios",
  "Atención del personal",
  "Precios",
  "Estacionamiento",
  "Vestidores / Regaderas",
  "Variedad de clases",
  "Sistema de consulta digital",
  "Planes y membresías",
  "Comunicación / Avisos",
  "Instalaciones generales",
];

const NEW_ACTIVITIES = [
  "Yoga",
  "Zumba",
  "Natación",
  "Spinning",
  "Pilates",
  "Funcional avanzado",
  "Atletismo",
  "Defensa personal",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const initialData = (): SurveyData => ({
  memberType: "",
  usageMonths: "",
  mainActivity: [],
  visitFrequency: "",
  cleanlinessRating: 0,
  equipmentRating: 0,
  spaceRating: 0,
  lockerRating: 0,
  classQualityRating: 0,
  coachKnowledgeRating: 0,
  coachAttitudeRating: 0,
  scheduleVarietyRating: 0,
  systemEaseRating: 0,
  membershipCheckRating: 0,
  notificationsRating: 0,
  usesSystem: "",
  priceValueRating: 0,
  plansVarietyRating: 0,
  paymentProcessRating: 0,
  overallRating: 0,
  recommendRating: 0,
  staffAttentionRating: 0,
  improvementAreas: [],
  newActivities: [],
  suggestions: "",
  bestAspect: "",
  submittedAt: "",
});

// ─── Star Rating Widget ───────────────────────────────────────────────────────

interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ value, onChange, disabled }) => (
  <StarRow>
    {[1, 2, 3, 4, 5].map((n) => (
      <React.Fragment key={n}>
        <StarButton
          type="button"
          selected={value >= n}
          onClick={() => !disabled && onChange(n)}
          aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
          disabled={disabled}
        >
          ⭐
        </StarButton>
        {n === 5 && value > 0 && (
          <StarLabel>{STAR_LABELS[value]}</StarLabel>
        )}
      </React.Fragment>
    ))}
  </StarRow>
);

// ─── Component ────────────────────────────────────────────────────────────────

const SatisfactionSurvey: React.FC = () => {
  const [data, setData] = useState<SurveyData>(initialData());
  const [errors, setErrors] = useState<SurveyErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Field Updaters ─────────────────────────────────────────────────────────

  const setRating = useCallback(
    (field: keyof SurveyData) => (value: number) => {
      setData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const setRadio = useCallback(
    (field: keyof SurveyData) => (value: string) => {
      setData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const toggleMulti = useCallback(
    (field: "mainActivity" | "improvementAreas" | "newActivities", value: string) => {
      setData((prev) => {
        const arr = prev[field] as string[];
        return {
          ...prev,
          [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
        };
      });
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const setText = useCallback(
    (field: keyof SurveyData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setData((prev) => ({ ...prev, [field]: e.target.value }));
    },
    []
  );

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: SurveyErrors = {};

    if (!data.memberType) errs.memberType = "Por favor selecciona una opción.";
    if (!data.usageMonths) errs.usageMonths = "Por favor selecciona una opción.";
    if (data.mainActivity.length === 0) errs.mainActivity = "Selecciona al menos una actividad.";
    if (!data.visitFrequency) errs.visitFrequency = "Por favor selecciona una opción.";

    const ratingFields: (keyof SurveyData)[] = [
      "cleanlinessRating", "equipmentRating", "spaceRating",
      "classQualityRating", "coachKnowledgeRating", "coachAttitudeRating",
      "priceValueRating", "overallRating", "recommendRating",
    ];
    ratingFields.forEach((f) => {
      if ((data[f] as number) === 0) errs[f] = "Por favor asigna una calificación.";
    });

    if (!data.usesSystem) errs.usesSystem = "Por favor selecciona una opción.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setSubmitting(true);
      try {
        const payload: SurveyData = {
          ...data,
          submittedAt: new Date().toISOString(),
        };
        await push(ref(realtimeDb, "surveys"), payload);
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        console.error("Error al guardar encuesta:", err);
        alert("Ocurrió un error al enviar la encuesta. Intenta de nuevo.");
      } finally {
        setSubmitting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  );

  // ── Success screen ────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <SurveyWrapper>
        <SuccessCard>
          <SuccessIcon>🏆</SuccessIcon>
          <SuccessTitle>¡Gracias por tu opinión!</SuccessTitle>
          <SuccessText>
            Tu respuesta ha sido registrada exitosamente. Tu retroalimentación nos ayuda a
            mejorar House Fighters Gym para toda la comunidad.
          </SuccessText>
        </SuccessCard>
      </SurveyWrapper>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <SurveyWrapper>
      <SurveyTitle>📋 Encuesta de Satisfacción</SurveyTitle>
      <SurveySubtitle>
        House Fighters Gym · Tu opinión impulsa nuestra mejora continua
      </SurveySubtitle>

      <form onSubmit={handleSubmit} noValidate>

        {/* ── Sección 1: Perfil ──────────────────────────────────────────────── */}
        <SectionTitle>1. Tu Perfil como Socio</SectionTitle>

        <QuestionBlock>
          <QuestionLabel>
            1.1 ¿Cuál es tu tipo de membresía actual?<RequiredMark>*</RequiredMark>
          </QuestionLabel>
          <RadioGroup>
            {["Gym", "MMA / Kick Boxing", "Wrestling", "Crossfit", "2 Actividades", "Plan Familiar", "Plan Amigos", "Visita / Clase suelta"].map((opt) => (
              <RadioOption key={opt} selected={data.memberType === opt}>
                <input type="radio" name="memberType" value={opt} onChange={() => setRadio("memberType")(opt)} />
                {opt}
              </RadioOption>
            ))}
          </RadioGroup>
          {errors.memberType && <ErrorMsg>{errors.memberType}</ErrorMsg>}
        </QuestionBlock>

        <QuestionBlock>
          <QuestionLabel>
            1.2 ¿Cuántos meses llevas siendo socio de House Fighters?<RequiredMark>*</RequiredMark>
          </QuestionLabel>
          <RadioGroup>
            {["Menos de 1 mes", "1 – 3 meses", "4 – 6 meses", "7 – 9 meses", "10 meses o más"].map((opt) => (
              <RadioOption key={opt} selected={data.usageMonths === opt}>
                <input type="radio" name="usageMonths" value={opt} onChange={() => setRadio("usageMonths")(opt)} />
                {opt}
              </RadioOption>
            ))}
          </RadioGroup>
          {errors.usageMonths && <ErrorMsg>{errors.usageMonths}</ErrorMsg>}
        </QuestionBlock>

        <QuestionBlock>
          <QuestionLabel>
            1.3 ¿Qué actividades practicas habitualmente? (puedes marcar varias)<RequiredMark>*</RequiredMark>
          </QuestionLabel>
          <CheckboxGroup>
            {ACTIVITIES.map((act) => (
              <CheckboxOption key={act} selected={data.mainActivity.includes(act)}>
                <input type="checkbox" value={act} onChange={() => toggleMulti("mainActivity", act)} />
                {act}
              </CheckboxOption>
            ))}
          </CheckboxGroup>
          {errors.mainActivity && <ErrorMsg>{errors.mainActivity}</ErrorMsg>}
        </QuestionBlock>

        <QuestionBlock>
          <QuestionLabel>
            1.4 ¿Con qué frecuencia visitas el gimnasio?<RequiredMark>*</RequiredMark>
          </QuestionLabel>
          <RadioGroup>
            {["1 vez por semana", "2 – 3 veces por semana", "4 – 5 veces por semana", "Todos los días"].map((opt) => (
              <RadioOption key={opt} selected={data.visitFrequency === opt}>
                <input type="radio" name="visitFrequency" value={opt} onChange={() => setRadio("visitFrequency")(opt)} />
                {opt}
              </RadioOption>
            ))}
          </RadioGroup>
          {errors.visitFrequency && <ErrorMsg>{errors.visitFrequency}</ErrorMsg>}
        </QuestionBlock>

        {/* ── Sección 2: Instalaciones ───────────────────────────────────────── */}
        <SectionTitle>2. Instalaciones y Equipamiento</SectionTitle>

        {[
          { field: "cleanlinessRating" as const, label: "2.1 Limpieza general de las instalaciones" },
          { field: "equipmentRating" as const, label: "2.2 Estado y variedad del equipamiento" },
          { field: "spaceRating" as const, label: "2.3 Amplitud y distribución del espacio" },
          { field: "lockerRating" as const, label: "2.4 Vestidores y áreas de apoyo" },
        ].map(({ field, label }) => (
          <QuestionBlock key={field}>
            <QuestionLabel>
              {label}{field !== "lockerRating" && <RequiredMark>*</RequiredMark>}
            </QuestionLabel>
            <StarRating value={data[field] as number} onChange={setRating(field)} disabled={submitting} />
            {errors[field] && <ErrorMsg>{errors[field]}</ErrorMsg>}
          </QuestionBlock>
        ))}

        {/* ── Sección 3: Actividades y Coaches ──────────────────────────────── */}
        <SectionTitle>3. Clases, Actividades y Coaches</SectionTitle>

        {[
          { field: "classQualityRating" as const, label: "3.1 Calidad general de las clases" },
          { field: "coachKnowledgeRating" as const, label: "3.2 Conocimiento técnico de los coaches" },
          { field: "coachAttitudeRating" as const, label: "3.3 Actitud y trato de los coaches" },
          { field: "scheduleVarietyRating" as const, label: "3.4 Variedad y cobertura de horarios" },
        ].map(({ field, label }) => (
          <QuestionBlock key={field}>
            <QuestionLabel>
              {label}<RequiredMark>*</RequiredMark>
            </QuestionLabel>
            <StarRating value={data[field] as number} onChange={setRating(field)} disabled={submitting} />
            {errors[field] && <ErrorMsg>{errors[field]}</ErrorMsg>}
          </QuestionBlock>
        ))}

        {/* ── Sección 4: Sistema digital ────────────────────────────────────── */}
        <SectionTitle>4. Sistema Digital de Membresía</SectionTitle>

        <QuestionBlock>
          <QuestionLabel>
            4.1 ¿Utilizas el sistema de consulta de membresía (número de socio)?<RequiredMark>*</RequiredMark>
          </QuestionLabel>
          <RadioGroup>
            {["Sí, frecuentemente", "Sí, a veces", "No lo he usado", "No sabía que existía"].map((opt) => (
              <RadioOption key={opt} selected={data.usesSystem === opt}>
                <input type="radio" name="usesSystem" value={opt} onChange={() => setRadio("usesSystem")(opt)} />
                {opt}
              </RadioOption>
            ))}
          </RadioGroup>
          {errors.usesSystem && <ErrorMsg>{errors.usesSystem}</ErrorMsg>}
        </QuestionBlock>

        {[
          { field: "systemEaseRating" as const, label: "4.2 Facilidad de uso del sistema de consulta" },
          { field: "membershipCheckRating" as const, label: "4.3 Utilidad de la información mostrada (estatus, días restantes)" },
          { field: "notificationsRating" as const, label: "4.4 Oportunidad de los avisos sobre vencimiento de membresía" },
        ].map(({ field, label }) => (
          <QuestionBlock key={field}>
            <QuestionLabel>{label}</QuestionLabel>
            <StarRating value={data[field] as number} onChange={setRating(field)} disabled={submitting} />
          </QuestionBlock>
        ))}

        {/* ── Sección 5: Precios y Planes ───────────────────────────────────── */}
        <SectionTitle>5. Precios y Planes de Membresía</SectionTitle>

        {[
          { field: "priceValueRating" as const, label: "5.1 Relación precio-calidad general" },
          { field: "plansVarietyRating" as const, label: "5.2 Variedad de planes disponibles (familiar, amigos, actividad extra)" },
          { field: "paymentProcessRating" as const, label: "5.3 Facilidad del proceso de pago" },
        ].map(({ field, label }) => (
          <QuestionBlock key={field}>
            <QuestionLabel>
              {label}{field === "priceValueRating" && <RequiredMark>*</RequiredMark>}
            </QuestionLabel>
            <StarRating value={data[field] as number} onChange={setRating(field)} disabled={submitting} />
            {errors[field] && <ErrorMsg>{errors[field]}</ErrorMsg>}
          </QuestionBlock>
        ))}

        {/* ── Sección 6: Experiencia General ───────────────────────────────── */}
        <SectionTitle>6. Experiencia General</SectionTitle>

        {[
          { field: "overallRating" as const, label: "6.1 Satisfacción general con House Fighters Gym" },
          { field: "staffAttentionRating" as const, label: "6.2 Atención y amabilidad del personal de recepción" },
          { field: "recommendRating" as const, label: "6.3 ¿Qué tan probable es que recomiendes el gimnasio a un amigo o familiar?" },
        ].map(({ field, label }) => (
          <QuestionBlock key={field}>
            <QuestionLabel>
              {label}<RequiredMark>*</RequiredMark>
            </QuestionLabel>
            <StarRating value={data[field] as number} onChange={setRating(field)} disabled={submitting} />
            {errors[field] && <ErrorMsg>{errors[field]}</ErrorMsg>}
          </QuestionBlock>
        ))}

        {/* ── Sección 7: Áreas de Mejora ────────────────────────────────────── */}
        <SectionTitle>7. Áreas de Mejora y Sugerencias</SectionTitle>

        <QuestionBlock>
          <QuestionLabel>7.1 ¿En qué áreas crees que debemos mejorar? (puedes marcar varias)</QuestionLabel>
          <CheckboxGroup>
            {IMPROVEMENT_AREAS.map((area) => (
              <CheckboxOption key={area} selected={data.improvementAreas.includes(area)}>
                <input type="checkbox" value={area} onChange={() => toggleMulti("improvementAreas", area)} />
                {area}
              </CheckboxOption>
            ))}
          </CheckboxGroup>
        </QuestionBlock>

        <QuestionBlock>
          <QuestionLabel>7.2 ¿Qué nuevas actividades o clases te gustaría que ofreciéramos?</QuestionLabel>
          <CheckboxGroup>
            {NEW_ACTIVITIES.map((act) => (
              <CheckboxOption key={act} selected={data.newActivities.includes(act)}>
                <input type="checkbox" value={act} onChange={() => toggleMulti("newActivities", act)} />
                {act}
              </CheckboxOption>
            ))}
          </CheckboxGroup>
        </QuestionBlock>

        <QuestionBlock>
          <QuestionLabel>7.3 ¿Cuál es el aspecto que más valoras de House Fighters Gym?</QuestionLabel>
          <TextInput
            type="text"
            placeholder="Escribe aquí lo que más te gusta..."
            value={data.bestAspect}
            onChange={setText("bestAspect")}
            maxLength={200}
            disabled={submitting}
          />
        </QuestionBlock>

        <QuestionBlock>
          <QuestionLabel>7.4 Comentarios adicionales, sugerencias o quejas</QuestionLabel>
          <Textarea
            placeholder="Comparte cualquier comentario que nos ayude a mejorar..."
            value={data.suggestions}
            onChange={setText("suggestions")}
            maxLength={800}
            disabled={submitting}
          />
        </QuestionBlock>

        <SubmitButton type="submit" disabled={submitting}>
          {submitting ? "Enviando..." : "Enviar Encuesta ✅"}
        </SubmitButton>
      </form>
    </SurveyWrapper>
  );
};

export default SatisfactionSurvey;
