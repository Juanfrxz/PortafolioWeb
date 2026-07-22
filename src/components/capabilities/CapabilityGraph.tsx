import React, {
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  CAPABILITY_DOMAIN_IDS,
  assertCapabilityProjectReferences,
  capabilityRelationKey,
  formatTechnologyLabel,
  groupCapabilityProjection,
  type CapabilityDomainId,
  type CapabilityProjectReference,
  type CapabilityRelation,
} from '../../lib/capabilities';
import type { Locale } from '../../lib/locale';

interface Props {
  locale: Locale;
  projection: readonly CapabilityRelation[];
  projects: readonly CapabilityProjectReference[];
  labels: CapabilityGraphLabels;
}

export interface CapabilityGraphLabels {
  frontend: string;
  backend: string;
  data: string;
  immersive: string;
  delivery: string;
  graphToolbar: string;
  selected: string;
  select: string;
  technologies: string;
  projects: string;
  empty: string;
  evidenceTitle: string;
}

const graphWidth = 840;
const domainY = 76;
const technologyColumns = 5;
const technologyStartY = 245;
const technologyRowGap = 112;
const technologyBottomSpace = 64;

function domainPosition(index: number) {
  return { x: 84 + index * 168, y: domainY };
}

function technologyPosition(index: number) {
  return {
    x: 84 + (index % technologyColumns) * 168,
    y:
      technologyStartY +
      Math.floor(index / technologyColumns) * technologyRowGap,
  };
}

function graphHeightForTechnologyCount(technologyCount: number): number {
  const rowCount = Math.max(1, Math.ceil(technologyCount / technologyColumns));

  return (
    technologyStartY + (rowCount - 1) * technologyRowGap + technologyBottomSpace
  );
}

export function CapabilityGraph({
  locale,
  projection,
  projects,
  labels,
}: Props) {
  const resultId = useId();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [hydrated, setHydrated] = useState(false);
  const [selectedDomain, setSelectedDomain] =
    useState<CapabilityDomainId>('frontend');
  const [focusIndex, setFocusIndex] = useState(0);
  const domainLabels: Record<CapabilityDomainId, string> = {
    frontend: labels.frontend,
    backend: labels.backend,
    data: labels.data,
    immersive: labels.immersive,
    delivery: labels.delivery,
  };
  const groups = useMemo(
    () => groupCapabilityProjection(projection),
    [projection],
  );
  const projectBySlug = useMemo(() => {
    const references = new Map(
      projects.map((project) => [project.slug, project]),
    );
    assertCapabilityProjectReferences(projection, references.keys());

    return references;
  }, [projection, projects]);
  const technologies = useMemo(
    () =>
      [...new Set(projection.map((relation) => relation.technologyId))].sort(),
    [projection],
  );
  const technologyPositions = new Map(
    technologies.map((technologyId, index) => [
      technologyId,
      technologyPosition(index),
    ]),
  );
  const graphHeight = graphHeightForTechnologyCount(technologies.length);
  const selectedGroup = groups.find(
    (group) => group.domainId === selectedDomain,
  );
  const selectedLabel = domainLabels[selectedDomain];
  const evidenceTitle = labels.evidenceTitle.replace('{domain}', selectedLabel);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const focusButton = (nextIndex: number) => {
    const normalizedIndex =
      (nextIndex + CAPABILITY_DOMAIN_IDS.length) % CAPABILITY_DOMAIN_IDS.length;
    setFocusIndex(normalizedIndex);
    buttonRefs.current[normalizedIndex]?.focus();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
    domainId: CapabilityDomainId,
  ) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        focusButton(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        focusButton(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusButton(0);
        break;
      case 'End':
        event.preventDefault();
        focusButton(CAPABILITY_DOMAIN_IDS.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        setSelectedDomain(domainId);
        break;
    }
  };

  return (
    <div
      className="capability-graph"
      data-capability-graph
      data-hydrated={hydrated ? 'true' : 'false'}
    >
      <div
        className="capability-graph__controls"
        role="toolbar"
        aria-label={labels.graphToolbar}
      >
        {CAPABILITY_DOMAIN_IDS.map((domainId, index) => {
          const isSelected = domainId === selectedDomain;

          return (
            <button
              key={domainId}
              ref={(element) => {
                buttonRefs.current[index] = element;
              }}
              type="button"
              aria-controls={resultId}
              aria-pressed={isSelected}
              tabIndex={focusIndex === index ? 0 : -1}
              onClick={() => {
                setSelectedDomain(domainId);
                setFocusIndex(index);
              }}
              onFocus={() => setFocusIndex(index)}
              onKeyDown={(event) => handleKeyDown(event, index, domainId)}
            >
              <span
                className="capability-graph__selection-shape"
                data-selection-shape={isSelected ? 'diamond' : 'circle'}
                aria-hidden="true"
              />
              <span className="capability-graph__domain-label">
                {domainLabels[domainId]}
              </span>
              <span className="capability-graph__selection-text">
                {isSelected ? labels.selected : labels.select}
              </span>
            </button>
          );
        })}
      </div>

      <svg
        className="capability-graph__visual"
        viewBox={`0 0 ${graphWidth} ${graphHeight}`}
        aria-hidden="true"
        focusable="false"
      >
        <g className="capability-graph__edges">
          {projection.map((relation) => {
            const domainIndex = CAPABILITY_DOMAIN_IDS.indexOf(
              relation.domainId,
            );
            const start = domainPosition(domainIndex);
            const end = technologyPositions.get(relation.technologyId);

            if (!end) return null;

            return (
              <line
                key={capabilityRelationKey(relation)}
                x1={start.x}
                y1={start.y + 25}
                x2={end.x}
                y2={end.y - 22}
                data-capability-relation={capabilityRelationKey(relation)}
                data-selected={relation.domainId === selectedDomain}
              />
            );
          })}
        </g>

        <g className="capability-graph__domain-nodes">
          {CAPABILITY_DOMAIN_IDS.map((domainId, index) => {
            const position = domainPosition(index);
            const isSelected = domainId === selectedDomain;

            return (
              <g
                key={domainId}
                transform={`translate(${position.x} ${position.y})`}
                data-selected={isSelected}
              >
                {isSelected ? (
                  <rect x="-19" y="-19" width="38" height="38" rx="3" />
                ) : (
                  <circle r="19" />
                )}
                <text y="42">{String(index + 1).padStart(2, '0')}</text>
              </g>
            );
          })}
        </g>

        <g className="capability-graph__technology-nodes">
          {technologies.map((technologyId, index) => {
            const position = technologyPosition(index);

            return (
              <g
                key={technologyId}
                transform={`translate(${position.x} ${position.y})`}
                data-technology-node={technologyId}
              >
                <circle r="14" />
                <text y="36">{formatTechnologyLabel(technologyId)}</text>
              </g>
            );
          })}
        </g>
      </svg>

      <section
        id={resultId}
        className="capability-graph__results"
        aria-labelledby={`${resultId}-heading`}
        aria-live="polite"
      >
        <h3 id={`${resultId}-heading`}>{evidenceTitle}</h3>
        {selectedGroup && selectedGroup.technologies.length > 0 ? (
          <ul className="capability-graph__technology-results">
            {selectedGroup.technologies.map((technology) => (
              <li key={technology.technologyId}>
                <h4>{formatTechnologyLabel(technology.technologyId)}</h4>
                <p>{labels.projects}</p>
                <ul>
                  {technology.projectSlugs.map((projectSlug) => {
                    const project = projectBySlug.get(projectSlug)!;

                    return (
                      <li key={projectSlug}>
                        <a href={project.href[locale]}>
                          {project.title[locale]}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <p>{labels.empty}</p>
        )}
        <span className="capability-graph__result-label">
          {labels.technologies}
        </span>
      </section>

      <style>{`
        .capability-graph {
          display: grid;
          gap: 1.5rem;
          padding: clamp(1rem, 3vw, 2rem);
          border: 1px solid var(--color-border);
          background: color-mix(in srgb, var(--color-panel), transparent 8%);
        }

        .capability-graph__controls {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.5rem;
        }

        .capability-graph__controls button {
          display: grid;
          grid-template-columns: 0.75rem minmax(0, 1fr);
          align-items: center;
          gap: 0.35rem 0.6rem;
          min-block-size: 4.5rem;
          padding: 0.65rem;
          border: 1px solid var(--color-border);
          background: transparent;
          color: inherit;
          text-align: start;
          cursor: pointer;
        }

        .capability-graph__controls button[aria-pressed='true'] {
          border-width: 2px;
          border-color: var(--color-signal);
        }

        .capability-graph__selection-shape {
          display: inline-block;
          inline-size: 0.62rem;
          block-size: 0.62rem;
          border: 1px solid currentColor;
          border-radius: 50%;
        }

        .capability-graph__selection-shape[data-selection-shape='diamond'] {
          border-radius: 1px;
          background: var(--color-signal);
          transform: rotate(45deg);
        }

        .capability-graph__domain-label {
          font-size: 0.82rem;
          font-weight: 600;
          line-height: 1.15;
        }

        .capability-graph__selection-text {
          grid-column: 2;
          color: var(--color-muted);
          font-family: var(--font-mono);
          font-size: 0.62rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .capability-graph__visual {
          inline-size: 100%;
          block-size: auto;
          overflow: visible;
        }

        .capability-graph__edges line {
          stroke: var(--color-border);
          stroke-width: 1.5;
        }

        .capability-graph__edges line[data-selected='true'] {
          stroke: var(--color-signal);
          stroke-width: 3;
          stroke-dasharray: 8 5;
        }

        .capability-graph__domain-nodes circle,
        .capability-graph__domain-nodes rect,
        .capability-graph__technology-nodes circle {
          fill: var(--color-panel);
          stroke: currentColor;
          stroke-width: 1.5;
        }

        .capability-graph__domain-nodes g[data-selected='true'] rect {
          fill: var(--color-signal);
          stroke: var(--color-signal);
          transform: rotate(45deg);
        }

        .capability-graph__domain-nodes text,
        .capability-graph__technology-nodes text {
          fill: currentColor;
          font-family: var(--font-mono);
          font-size: 12px;
          text-anchor: middle;
        }

        .capability-graph__results {
          position: relative;
          display: grid;
          gap: 1rem;
          padding-block-start: 1.25rem;
          border-block-start: 1px solid var(--color-border);
        }

        .capability-graph__results h3 {
          font-size: clamp(1.35rem, 3vw, 2rem);
        }

        .capability-graph__result-label {
          position: absolute;
          inset-block-start: 1.35rem;
          inset-inline-end: 0;
          color: var(--color-signal);
          font-family: var(--font-mono);
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .capability-graph__technology-results,
        .capability-graph__technology-results ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .capability-graph__technology-results {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
          gap: 1rem;
        }

        .capability-graph__technology-results > li {
          display: grid;
          gap: 0.4rem;
          padding: 0.8rem;
          border: 1px solid var(--color-border);
        }

        .capability-graph__technology-results h4 {
          font-size: 0.95rem;
        }

        .capability-graph__technology-results p {
          color: var(--color-muted);
          font-family: var(--font-mono);
          font-size: 0.62rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .capability-graph__technology-results a {
          color: inherit;
          font-size: 0.82rem;
        }

        @media (max-width: 50rem) {
          .capability-graph__controls {
            grid-template-columns: 1fr 1fr;
          }

          .capability-graph__controls button:last-child {
            grid-column: 1 / -1;
          }

          .capability-graph__visual {
            display: none;
          }

          .capability-graph__result-label {
            position: static;
            grid-row: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default CapabilityGraph;
