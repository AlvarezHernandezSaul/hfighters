import { useState, useMemo, useCallback } from "react";
import styled from "styled-components";
import useFirebaseData from "../firebase/useFirebaseData";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SurveyEntry {
  id: string;
  memberType: string;
  usageMonths: string;
  mainActivity: string[];
  visitFrequency: string;
  cleanlinessRating: number;
  equipmentRating: number;
  spaceRating: number;
  lockerRating: number;
  classQualityRating: number;
  coachKnowledgeRating: number;
  coachAttitudeRating: number;
  scheduleVarietyRating: number;
  systemEaseRating: number;
  membershipCheckRating: number;
  notificationsRating: number;
  usesSystem: string;
  priceValueRating: number;
  plansVarietyRating: number;
  paymentProcessRating: number;
  overallRating: number;
  recommendRating: number;
  staffAttentionRating: number;
  improvementAreas: string[];
  newActivities: string[];
  suggestions: string;
  bestAspect: string;
  submittedAt: string;
}

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  color: #000;
  margin-bottom: 4px;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 24px;
  font-size: 0.9rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const StatCard = styled.div<{ highlight?: boolean }>`
  background: ${(p) => (p.highlight ? "#000" : "#f8f9fa")};
  color: ${(p) => (p.highlight ? "#fff" : "#333")};
  border-radius: 10px;
  padding: 18px 16px;
  text-align: center;
  border: 1px solid #e0e0e0;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 0.82rem;
  opacity: 0.85;
`;

const SectionTitle = styled.h3`
  font-size: 1.05rem;
  color: #fff;
  background-color: #000;
  padding: 8px 14px;
  border-radius: 6px;
  margin: 28px 0 14px;
`;

const BarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const BarLabel = styled.span`
  min-width: 220px;
  font-size: 0.88rem;
  color: #333;
`;

const BarTrack = styled.div`
  flex: 1;
  height: 18px;
  background: #e9ecef;
  border-radius: 9px;
  overflow: hidden;
`;

const BarFill = styled.div<{ pct: number; color?: string }>`
  height: 100%;
  width: ${(p) => p.pct}%;
  background: ${(p) => p.color || "#007bff"};
  border-radius: 9px;
  transition: width 0.4s ease;
`;

const BarValue = styled.span`
  min-width: 40px;
  font-size: 0.85rem;
  font-weight: bold;
  color: #555;
`;

const TagCloud = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
`;

const Tag = styled.span<{ size: number }>`
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: ${(p) => Math.max(0.78, Math.min(1.1, p.size))}rem;
  color: #333;
`;

const CommentCard = styled.div`
  background: #f8f9fa;
  border-left: 4px solid #007bff;
  padding: 12px 16px;
  border-radius: 0 6px 6px 0;
  margin-bottom: 10px;
  font-size: 0.92rem;
  color: #444;
`;

const EmptyState = styled.p`
  color: #888;
  font-style: italic;
  font-size: 0.9rem;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Select = styled.select`
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 0.9rem;
  background: #fff;
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const avg = (entries: SurveyEntry[], field: keyof SurveyEntry): number => {
  const vals = entries.map((e) => Number(e[field])).filter((v) => v > 0);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
};

const ratingColor = (v: number) => {
  if (v >= 4.5) return "#28a745";
  if (v >= 3.5) return "#007bff";
  if (v >= 2.5) return "#ffc107";
  return "#dc3545";
};

const countBy = (entries: SurveyEntry[], field: keyof SurveyEntry): Record<string, number> => {
  const counts: Record<string, number> = {};
  entries.forEach((e) => {
    const val = e[field];
    if (Array.isArray(val)) {
      val.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
    } else if (val) {
      const key = String(val);
      counts[key] = (counts[key] || 0) + 1;
    }
  });
  return counts;
};

// ─── Sub-component ────────────────────────────────────────────────────────────

const RatingBar = ({ label, value, maxValue = 5 }: { label: string; value: number; maxValue?: number }) => (
  <BarRow>
    <BarLabel>{label}</BarLabel>
    <BarTrack>
      <BarFill pct={(value / maxValue) * 100} color={ratingColor(value)} />
    </BarTrack>
    <BarValue>{value > 0 ? value.toFixed(1) : "—"} ⭐</BarValue>
  </BarRow>
);

const FreqBar = ({ label, count, total }: { label: string; count: number; total: number }) => (
  <BarRow>
    <BarLabel>{label}</BarLabel>
    <BarTrack>
      <BarFill pct={total > 0 ? (count / total) * 100 : 0} color="#6c757d" />
    </BarTrack>
    <BarValue>{count}</BarValue>
  </BarRow>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const SurveyResults: React.FC = () => {
  const { data: rawData, error } = useFirebaseData("surveys");
  const [memberFilter, setMemberFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  const allEntries = useMemo<SurveyEntry[]>(() => {
    if (!rawData) return [];
    return Object.keys(rawData).map((key) => ({ id: key, ...rawData[key] } as SurveyEntry));
  }, [rawData]);

  const entries = useMemo(() => {
    return allEntries.filter((e) => {
      if (memberFilter && e.memberType !== memberFilter) return false;
      if (monthFilter && e.usageMonths !== monthFilter) return false;
      return true;
    });
  }, [allEntries, memberFilter, monthFilter]);

  const overallAvg = avg(entries, "overallRating");
  const recommendAvg = avg(entries, "recommendRating");
  const npsPositive = entries.filter((e) => e.recommendRating >= 4).length;
  const npsPct = entries.length > 0 ? Math.round((npsPositive / entries.length) * 100) : 0;

  const memberCounts = useMemo(() => countBy(entries, "memberType"), [entries]);
  const freqCounts = useMemo(() => countBy(entries, "visitFrequency"), [entries]);
  const improvementCounts = useMemo(() => countBy(entries, "improvementAreas"), [entries]);
  const newActivityCounts = useMemo(() => countBy(entries, "newActivities"), [entries]);
  const usesSystemCounts = useMemo(() => countBy(entries, "usesSystem"), [entries]);

  const uniqueMemberTypes = useMemo(() => [...new Set(allEntries.map((e) => e.memberType).filter(Boolean))], [allEntries]);
  const uniqueMonths = useMemo(() => [...new Set(allEntries.map((e) => e.usageMonths).filter(Boolean))], [allEntries]);

  const comments = useMemo(
    () => entries.filter((e) => e.suggestions && e.suggestions.trim().length > 0).map((e) => e.suggestions),
    [entries]
  );

  const bestAspects = useMemo(
    () => entries.filter((e) => e.bestAspect && e.bestAspect.trim().length > 0),
    [entries]
  );

  const bestAspectWords = useMemo(() => {
    const wordCounts: Record<string, number> = {};
    bestAspects.forEach((e) => {
      e.bestAspect.toLowerCase().split(/\s+/).forEach((w) => {
        const clean = w.replace(/[^a-záéíóúñ]/gi, "");
        if (clean.length > 3) wordCounts[clean] = (wordCounts[clean] || 0) + 1;
      });
    });
    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
  }, [bestAspects]);

  const handleMemberFilter = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setMemberFilter(e.target.value), []);
  const handleMonthFilter = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setMonthFilter(e.target.value), []);

  if (error) return <p style={{ color: "red" }}>Error al cargar resultados: {error}</p>;

  return (
    <Container>
      <Title>📊 Resultados de la Encuesta de Satisfacción</Title>
      <Subtitle>House Fighters Gym · Análisis de retroalimentación de socios</Subtitle>

      {/* Filtros */}
      <FilterRow>
        <Select value={memberFilter} onChange={handleMemberFilter}>
          <option value="">Todos los tipos de membresía</option>
          {uniqueMemberTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Select value={monthFilter} onChange={handleMonthFilter}>
          <option value="">Todos los rangos de antigüedad</option>
          {uniqueMonths.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
      </FilterRow>

      {/* KPIs */}
      <StatsGrid>
        <StatCard highlight>
          <StatValue>{entries.length}</StatValue>
          <StatLabel>Respuestas totales</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue style={{ color: ratingColor(overallAvg) }}>
            {overallAvg > 0 ? overallAvg.toFixed(1) : "—"} ⭐
          </StatValue>
          <StatLabel>Satisfacción general promedio</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue style={{ color: ratingColor(recommendAvg) }}>
            {recommendAvg > 0 ? recommendAvg.toFixed(1) : "—"} ⭐
          </StatValue>
          <StatLabel>Probabilidad de recomendación</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{npsPct}%</StatValue>
          <StatLabel>Promotores (calificación ≥ 4)</StatLabel>
        </StatCard>
      </StatsGrid>

      {entries.length === 0 ? (
        <EmptyState>No hay respuestas registradas para los filtros seleccionados.</EmptyState>
      ) : (
        <>
          {/* Instalaciones */}
          <SectionTitle>Instalaciones y Equipamiento</SectionTitle>
          <RatingBar label="Limpieza general" value={avg(entries, "cleanlinessRating")} />
          <RatingBar label="Estado y variedad del equipamiento" value={avg(entries, "equipmentRating")} />
          <RatingBar label="Amplitud y distribución del espacio" value={avg(entries, "spaceRating")} />
          <RatingBar label="Vestidores y áreas de apoyo" value={avg(entries, "lockerRating")} />

          {/* Clases y Coaches */}
          <SectionTitle>Clases, Actividades y Coaches</SectionTitle>
          <RatingBar label="Calidad general de las clases" value={avg(entries, "classQualityRating")} />
          <RatingBar label="Conocimiento técnico de los coaches" value={avg(entries, "coachKnowledgeRating")} />
          <RatingBar label="Actitud y trato de los coaches" value={avg(entries, "coachAttitudeRating")} />
          <RatingBar label="Variedad y cobertura de horarios" value={avg(entries, "scheduleVarietyRating")} />

          {/* Sistema digital */}
          <SectionTitle>Sistema Digital de Membresía</SectionTitle>
          {Object.entries(usesSystemCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([label, count]) => (
              <FreqBar key={label} label={label} count={count} total={entries.length} />
            ))}
          <RatingBar label="Facilidad de uso" value={avg(entries, "systemEaseRating")} />
          <RatingBar label="Utilidad de la información mostrada" value={avg(entries, "membershipCheckRating")} />
          <RatingBar label="Oportunidad de avisos de vencimiento" value={avg(entries, "notificationsRating")} />

          {/* Precios */}
          <SectionTitle>Precios y Planes de Membresía</SectionTitle>
          <RatingBar label="Relación precio-calidad" value={avg(entries, "priceValueRating")} />
          <RatingBar label="Variedad de planes" value={avg(entries, "plansVarietyRating")} />
          <RatingBar label="Facilidad del proceso de pago" value={avg(entries, "paymentProcessRating")} />

          {/* Experiencia general */}
          <SectionTitle>Experiencia General</SectionTitle>
          <RatingBar label="Satisfacción general" value={avg(entries, "overallRating")} />
          <RatingBar label="Atención del personal de recepción" value={avg(entries, "staffAttentionRating")} />
          <RatingBar label="Probabilidad de recomendación" value={avg(entries, "recommendRating")} />

          {/* Distribución por tipo de membresía */}
          <SectionTitle>Distribución por Tipo de Membresía</SectionTitle>
          {Object.entries(memberCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([label, count]) => (
              <FreqBar key={label} label={label} count={count} total={entries.length} />
            ))}

          {/* Frecuencia de visita */}
          <SectionTitle>Frecuencia de Visita</SectionTitle>
          {Object.entries(freqCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([label, count]) => (
              <FreqBar key={label} label={label} count={count} total={entries.length} />
            ))}

          {/* Áreas de mejora */}
          <SectionTitle>Áreas de Mejora Más Solicitadas</SectionTitle>
          {Object.keys(improvementCounts).length === 0 ? (
            <EmptyState>Sin datos.</EmptyState>
          ) : (
            Object.entries(improvementCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([label, count]) => (
                <FreqBar key={label} label={label} count={count} total={entries.length} />
              ))
          )}

          {/* Nuevas actividades */}
          <SectionTitle>Nuevas Actividades Solicitadas</SectionTitle>
          {Object.keys(newActivityCounts).length === 0 ? (
            <EmptyState>Sin datos.</EmptyState>
          ) : (
            Object.entries(newActivityCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([label, count]) => (
                <FreqBar key={label} label={label} count={count} total={entries.length} />
              ))
          )}

          {/* Nube de palabras – mejor aspecto */}
          {bestAspectWords.length > 0 && (
            <>
              <SectionTitle>Palabras Clave – Mejor Aspecto</SectionTitle>
              <TagCloud>
                {bestAspectWords.map(([word, count]) => (
                  <Tag key={word} size={0.78 + count * 0.08}>
                    {word} ({count})
                  </Tag>
                ))}
              </TagCloud>
            </>
          )}

          {/* Comentarios */}
          {comments.length > 0 && (
            <>
              <SectionTitle>Comentarios y Sugerencias ({comments.length})</SectionTitle>
              {comments.slice(0, 20).map((c, i) => (
                <CommentCard key={i}>{c}</CommentCard>
              ))}
              {comments.length > 20 && (
                <EmptyState>Mostrando los primeros 20 comentarios de {comments.length} en total.</EmptyState>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default SurveyResults;
