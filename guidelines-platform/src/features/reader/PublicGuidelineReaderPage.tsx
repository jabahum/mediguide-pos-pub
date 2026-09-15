import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  getPublicGuideline,
  getPublicGuidelineContent,
  getPublicGuidelineManifest,
  getPublicGuidelineMarkdown,
  getPublicGuidelineOriginal,
  getPublicGuidelineSection,
  listPublicGuidelineFigures,
  PublicApiError,
  type PublicGuideline,
  type PublicAICitation,
  type PublicGuidelineAlgorithm,
  type PublicGuidelineBlock,
  type PublicGuidelineFigure,
  type PublicGuidelineManifest,
  type PublicGuidelineSection,
  type PublicGuidelineSectionDetail,
  type PublicGuidelineTable,
  type PublicMarkdown,
} from "../../api/public-guidelines";
import { Brand } from "../../components/common/Brand";
import { PageLoading } from "../../components/common/PageLoading";
import { dashboardLoginUrl } from "../../config";
import {
  BookGuidelineReader,
  type SupplementalReaderView,
} from "./components/BookGuidelineReader";
import {
  GuidelineBlockRenderer,
  StructuredAlgorithm,
  StructuredTable,
} from "./components/GuidelineBlockRenderer";
import { EmptyReviewedSection } from "./components/EmptyReviewedSection";
import { reviewedDescendants } from "./components/empty-reviewed-section";

type ReaderView = "read" | SupplementalReaderView;

type ReaderData = {
  guideline: PublicGuideline;
  manifest?: PublicGuidelineManifest;
  sections: PublicGuidelineSection[];
  blocks: PublicGuidelineBlock[];
  tables: PublicGuidelineTable[];
  figures: PublicGuidelineFigure[];
  algorithms: PublicGuidelineAlgorithm[];
  markdown?: PublicMarkdown;
  partial: boolean;
};

type ReaderState =
  | { status: "loading" }
  | { status: "ready"; requestId: string; data: ReaderData }
  | { status: "not-found"; requestId: string }
  | { status: "error"; requestId: string };

type SectionState =
  | { status: "idle" }
  | { status: "ready"; sectionId: string; detail: PublicGuidelineSectionDetail }
  | { status: "error"; sectionId: string };

type SectionDisplayState = SectionState | { status: "loading" };

export function PublicGuidelineReaderPage() {
  const { guidelineId = "" } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<ReaderState>({ status: "loading" });
  const [sectionState, setSectionState] = useState<SectionState>({
    status: "idle",
  });
  const selectedSectionId = searchParams.get("section") ?? "";
  const requestedView = parseView(searchParams.get("view"));

  useEffect(() => {
    const controller = new AbortController();
    loadReaderData(guidelineId, controller.signal)
      .then((data) =>
        setState({ status: "ready", requestId: guidelineId, data }),
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (import.meta.env.DEV) {
          console.warn("Public guideline reader request failed", {
            kind: error instanceof PublicApiError ? error.kind : "unknown",
          });
        }
        setState(
          error instanceof PublicApiError && error.kind === "not-found"
            ? { status: "not-found", requestId: guidelineId }
            : { status: "error", requestId: guidelineId },
        );
      });
    return () => controller.abort();
  }, [guidelineId, reloadKey]);

  useEffect(() => {
    if (
      state.status !== "ready" ||
      state.requestId !== guidelineId ||
      !selectedSectionId
    )
      return;
    if (
      !state.data.sections.some((section) => section.id === selectedSectionId)
    )
      return;
    const controller = new AbortController();
    getPublicGuidelineSection(
      guidelineId,
      selectedSectionId,
      state.data.manifest!,
      controller.signal,
    )
      .then((detail) =>
        setSectionState({
          status: "ready",
          sectionId: selectedSectionId,
          detail,
        }),
      )
      .catch(() => {
        if (!controller.signal.aborted)
          setSectionState({ status: "error", sectionId: selectedSectionId });
      });
    return () => controller.abort();
  }, [guidelineId, selectedSectionId, state]);

  useEffect(() => {
    if (state.status !== "ready") return;
    document.title = `${state.data.guideline.title} | MediGuide`;
    updateMetaDescription(state.data.guideline.description);
  }, [state]);

  useEffect(() => {
    if (state.status !== "ready" || !location.hash) return;
    const id = decodeURIComponent(location.hash.slice(1));
    const frame = requestAnimationFrame(() =>
      document.getElementById(id)?.scrollIntoView({ block: "start" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [location.hash, sectionState, state]);

  if (state.status === "loading" || state.requestId !== guidelineId)
    return <PageLoading label="Loading published clinical guidance…" />;
  if (state.status === "not-found")
    return (
      <ReaderMessage
        title="Guideline not found"
        message="This guideline is unavailable or has not been published."
      />
    );
  if (state.status === "error") {
    return (
      <ReaderMessage
        title="We could not load this guideline"
        message="Check your connection and try again."
      >
        <button
          className="button button-primary"
          onClick={() => {
            setState({ status: "loading" });
            setReloadKey((key) => key + 1);
          }}
        >
          Try again
        </button>
      </ReaderMessage>
    );
  }

  const { data } = state;
  const tabs = availableViews(data);
  const view = tabs.includes(requestedView) ? requestedView : tabs[0];
  const selectView = (nextView: ReaderView) => {
    const next = new URLSearchParams(searchParams);
    next.set("view", nextView);
    if (nextView !== "chapters") next.delete("section");
    setSearchParams(next);
  };
  const selectSection = (sectionId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("view", "chapters");
    next.set("section", sectionId);
    setSearchParams(next);
  };

  if (view === "read" && data.markdown) {
    return (
      <BookGuidelineReader
        guideline={data.guideline}
        manifest={data.manifest}
        markdown={data.markdown}
        supplementalViews={tabs.filter(
          (tab): tab is SupplementalReaderView => tab !== "read",
        )}
        partial={data.partial}
        onSelectView={selectView}
        onOpenOriginal={(page) => openOriginal(guidelineId, page)}
        onCitation={(citation) =>
          openCitation(citation, data.sections, selectSection, () =>
            openOriginal(guidelineId, citation.page_start),
          )
        }
      />
    );
  }

  return (
    <div className="backend-reader structured-reader">
      <a className="skip-link" href="#guideline-content">
        Skip to clinical content
      </a>
      <header className="backend-reader-header">
        <Link to="/" aria-label="MediGuide guideline library">
          <Brand />
        </Link>
        <nav aria-label="Reader actions">
          <Link to="/">All guidelines</Link>
          <button type="button" onClick={() => window.print()}>
            Print
          </button>
          <a href={dashboardLoginUrl}>Login</a>
        </nav>
      </header>

      <main id="guideline-content">
        <GuidelineHero
          data={data}
          onOpenOriginal={(page) => openOriginal(guidelineId, page)}
        />
        <div className="guideline-tabs-shell">
          <nav className="guideline-tabs" aria-label="Guideline content">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                aria-current={view === tab ? "page" : undefined}
                onClick={() => selectView(tab)}
              >
                {viewLabel(tab)}
              </button>
            ))}
          </nav>
        </div>

        {data.partial && (
          <div className="partial-extraction-notice" role="status">
            {data.manifest?.reviewed_section_count ?? 0} of {data.manifest?.section_count ?? data.sections.length} sections contain reviewed content.
            {data.manifest?.has_original_pdf
              ? " The original document remains available as the fidelity reference."
              : " Unreviewed content is not publicly available."}
          </div>
        )}

        <div
          className={`structured-reader-body ${view === "chapters" ? "has-sections" : ""}`}
        >
          {view === "chapters" && (
            <SectionNavigation
              sections={data.sections}
              selectedId={selectedSectionId}
              onSelect={selectSection}
            />
          )}
          <div className="structured-reader-content">
            {view === "overview" && (
              <Overview data={data} onSelect={selectView} />
            )}
            {view === "chapters" && (
              <SectionReader
                data={data}
                state={sectionDisplayState(
                  sectionState,
                  selectedSectionId,
                  data.sections,
                )}
                onSelect={selectSection}
                onOpenSourcePage={(page) => openOriginal(guidelineId, page)}
                onOpenOriginal={() => openOriginal(guidelineId)}
              />
            )}
            {view === "tables" && (
              <TablesView
                items={data.tables}
                onOpenSourcePage={(page) => openOriginal(guidelineId, page)}
              />
            )}
            {view === "figures" && (
              <FiguresView
                items={data.figures}
                onOpenSourcePage={(page) => openOriginal(guidelineId, page)}
              />
            )}
            {view === "algorithms" && (
              <AlgorithmsView
                items={data.algorithms}
                onOpenSourcePage={(page) => openOriginal(guidelineId, page)}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

async function loadReaderData(
  id: string,
  signal: AbortSignal,
): Promise<ReaderData> {
  // Metadata, publication identity, and Markdown are independent. Starting them
  // together removes two avoidable network round trips on a cold reader load.
  const manifestRequest = attempt(getPublicGuidelineManifest(id, signal));
  const markdownRequest = attempt(getPublicGuidelineMarkdown(id, signal));
  const [guideline, manifestResult] = await Promise.all([
    getPublicGuideline(id, signal),
    manifestRequest,
  ]);
  let manifest: PublicGuidelineManifest | undefined;
  let partial: boolean;
  if (manifestResult.ok) {
    manifest = manifestResult.value;
    partial = manifest.extraction_quality === "partially_reviewed";
  } else {
    const error = manifestResult.error;
    if (signal.aborted) throw error;
    if (error instanceof PublicApiError && error.kind === "rate-limited")
      throw error;
    partial = true;
  }
  const structured =
    manifest !== undefined &&
    manifest.extraction_quality !== "markdown_fallback" &&
    manifest.section_count > 0;
  let sections: PublicGuidelineSection[] = [];
  let tables: PublicGuidelineTable[] = [];
  let blocks: PublicGuidelineBlock[] = [];
  let figures: PublicGuidelineFigure[] = [];
  let algorithms: PublicGuidelineAlgorithm[] = [];
  if (structured && manifest) {
    const requests: Array<Promise<unknown>> = [getPublicGuidelineContent(id, manifest, signal)];
    if (manifest.has_figures)
      requests.push(listPublicGuidelineFigures(id, signal));
    const identityCheckIndex = requests.length;
    requests.push(getPublicGuidelineManifest(id, signal, true));
    const results = await Promise.allSettled(requests);
    const contentResult = results[0];
    if (contentResult.status === "fulfilled") {
      const content = contentResult.value as Awaited<ReturnType<typeof getPublicGuidelineContent>>;
      sections = content.sections;
      blocks = content.blocks;
      tables = content.blocks.filter((block) => block.type === "table").map(tableFromBlock);
      algorithms = content.blocks.filter((block) => block.type === "algorithm").map(algorithmFromBlock);
    } else {
      partial = true;
    }
    if (manifest.has_figures) {
      const result = results[1];
      if (result.status === "fulfilled")
        figures = (
          result.value as Awaited<ReturnType<typeof listPublicGuidelineFigures>>
        ).items;
      else partial = true;
    }
    const identityResult = results[identityCheckIndex];
    if (identityResult.status === "rejected") throw identityResult.reason;
    const currentManifest = identityResult.value as PublicGuidelineManifest;
    if (publicationIdentity(currentManifest) !== publicationIdentity(manifest)) {
      throw new PublicApiError("invalid-response");
    }
  }
  let markdown: PublicMarkdown | undefined;
  const markdownResult = await markdownRequest;
  if (markdownResult.ok) {
    markdown = markdownResult.value;
  } else {
    const error = markdownResult.error;
    if (signal.aborted) throw error;
    if (error instanceof PublicApiError && error.kind === "rate-limited")
      throw error;
    if (!(error instanceof PublicApiError) || error.kind !== "not-found")
      partial = true;
  }
  return {
    guideline,
    manifest,
    sections,
    blocks,
    tables,
    figures,
    algorithms,
    markdown,
    partial,
  };
}

type Attempt<T> =
  | { ok: true; value: T }
  | { ok: false; error: unknown };

async function attempt<T>(request: Promise<T>): Promise<Attempt<T>> {
  try {
    return { ok: true, value: await request };
  } catch (error) {
    return { ok: false, error };
  }
}

function GuidelineHero({
  data,
  onOpenOriginal,
}: {
  data: ReaderData;
  onOpenOriginal: (page?: number) => void;
}) {
  const { guideline, manifest } = data;
  return (
    <header className="guideline-home page-shell">
      <Link className="back-link" to="/">
        ← Guideline library
      </Link>
      <div className="guideline-home-grid">
        <div>
          <span className="eyebrow">
            {guideline.program_area || "Published clinical guideline"}
          </span>
          <h1>{guideline.title}</h1>
          {guideline.description && <p>{guideline.description}</p>}
          <div className="guideline-home-actions">
            {manifest?.has_chapters && (
              <a className="button button-primary" href="?view=chapters">
                Read guideline
              </a>
            )}
            {manifest?.has_original_pdf === true && (
              <button
                className="button button-outline"
                type="button"
                onClick={() => onOpenOriginal()}
              >
                Open original PDF
              </button>
            )}
          </div>
        </div>
        <dl className="guideline-facts">
          <Meta label="Source" value={guideline.source_org} />
          <Meta label="Version" value={guideline.version} />
          <Meta
            label="Published"
            value={formatDate(guideline.publication_date)}
          />
          <Meta label="Review date" value={formatDate(guideline.review_date)} />
          <Meta label="Language" value={guideline.language} />
          <Meta
            label="Content quality"
            value={qualityLabel(manifest?.extraction_quality)}
          />
        </dl>
      </div>
    </header>
  );
}

function Overview({
  data,
  onSelect,
}: {
  data: ReaderData;
  onSelect: (view: ReaderView) => void;
}) {
  const manifest = data.manifest;
  return (
    <section className="guideline-overview">
      <div>
        <span className="eyebrow">About this guideline</span>
        <h2>Published content</h2>
        <p>
          {data.guideline.description ||
            "Review the current published clinical guidance and available source material."}
        </p>
      </div>
      {manifest ? (
        <div
          className="capability-grid"
          aria-label="Available guideline content"
        >
          {manifest.has_chapters && (
            <Capability
              title="Chapters"
              count={manifest.section_count}
              onClick={() => onSelect("chapters")}
            />
          )}
          {manifest.has_tables && (
            <Capability
              title="Tables"
              count={manifest.table_count}
              onClick={() => onSelect("tables")}
            />
          )}
          {manifest.has_figures && (
            <Capability
              title="Figures"
              count={manifest.figure_count}
              onClick={() => onSelect("figures")}
            />
          )}
          {manifest.has_algorithms && (
            <Capability
              title="Algorithms"
              count={manifest.algorithm_count}
              onClick={() => onSelect("algorithms")}
            />
          )}
        </div>
      ) : (
        <div className="partial-extraction-notice">
          A structured manifest is not available. This guideline is presented
          using its published compatibility format.
        </div>
      )}
    </section>
  );
}

function Capability({
  title,
  count,
  onClick,
}: {
  title: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}>
      <strong>{title}</strong>
      <span>{count} available</span>
      <b aria-hidden="true">→</b>
    </button>
  );
}

function SectionNavigation({
  sections,
  selectedId,
  onSelect,
}: {
  sections: PublicGuidelineSection[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="structured-section-nav">
      <p className="eyebrow">On this guideline</p>
      <nav aria-label="Guideline sections">
        {sections.map((section) => (
          <button
            style={
              {
                "--section-level": Math.max(0, section.level - 1),
              } as React.CSSProperties
            }
            type="button"
            key={section.id}
            aria-current={selectedId === section.id ? "page" : undefined}
            onClick={() => onSelect(section.id)}
          >
            {section.title}
            <small>{sourcePages(section.page_start, section.page_end)}</small>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function SectionReader({
  data,
  state,
  onSelect,
  onOpenSourcePage,
  onOpenOriginal,
}: {
  data: ReaderData;
  state: SectionDisplayState;
  onSelect: (id: string) => void;
  onOpenSourcePage: (page: number) => void;
  onOpenOriginal: () => void;
}) {
  if (data.sections.length === 0)
    return (
      <ContentState
        title="Structured chapters are unavailable"
        message={
          data.manifest?.has_original_pdf
            ? "Open the original document to read this publication."
            : "This publication does not yet contain reviewed structured chapters."
        }
      />
    );
  if (state.status === "idle")
    return (
      <section className="section-welcome">
        <span className="eyebrow">Chapters</span>
        <h2>Select a section</h2>
        <p>
          This publication has {data.manifest?.section_count ?? data.sections.length} section
          {(data.manifest?.section_count ?? data.sections.length) === 1 ? "" : "s"}, including {data.manifest?.reviewed_section_count ?? 0} with reviewed content. Its navigation follows the structure of the uploaded document.
        </p>
        <button
          className="button button-primary"
          onClick={() => onSelect(data.sections[0].id)}
        >
          Open first section
        </button>
      </section>
    );
  if (state.status === "loading")
    return <PageLoading label="Loading reviewed section…" />;
  if (state.status === "error")
    return (
      <ContentState
        title="Section unavailable"
        message={
          data.manifest?.has_original_pdf
            ? "This section could not be loaded. Choose another section or open the original document."
            : "This section could not be loaded. Choose another reviewed section and try again."
        }
      />
    );
  const figures = new Map(data.figures.map((figure) => [figure.id, figure]));
  const descendants = reviewedDescendants(
    state.detail.section.id,
    data.sections,
    data.blocks,
  );
  return (
    <article className="structured-section">
      <header>
        <span className="eyebrow">
          {sourcePages(
            state.detail.section.page_start,
            state.detail.section.page_end,
          )}
        </span>
        <h2>{state.detail.section.title}</h2>
      </header>
      {state.detail.blocks.length > 0 ? (
        state.detail.blocks.map((block) => (
          <GuidelineBlockRenderer
            block={block}
            figure={figures.get(block.id)}
            key={block.id}
            onOpenSourcePage={onOpenSourcePage}
          />
        ))
      ) : <EmptyReviewedSection hasOriginalDocument={Boolean(data.manifest?.has_original_pdf)} descendants={descendants} onSection={onSelect} onOpenOriginal={onOpenOriginal} />}
    </article>
  );
}

function TablesView({
  items,
  onOpenSourcePage,
}: {
  items: PublicGuidelineTable[];
  onOpenSourcePage: (page: number) => void;
}) {
  if (!items.length)
    return (
      <ContentState
        title="No reviewed tables"
        message="This publication does not expose any reviewed structured tables."
      />
    );
  return (
    <section className="content-collection">
      <header>
        <span className="eyebrow">Tables</span>
        <h2>Reviewed tables</h2>
      </header>
      {items.map((item) => (
        <article key={item.id} id={`block-${item.id}`}>
          <StructuredTable content={item.content} />
          {item.page_start && (
            <button
              className="block-source"
              onClick={() => onOpenSourcePage(item.page_start!)}
            >
              Source page {sourcePages(item.page_start, item.page_end)}
            </button>
          )}
        </article>
      ))}
    </section>
  );
}

function FiguresView({
  items,
  onOpenSourcePage,
}: {
  items: PublicGuidelineFigure[];
  onOpenSourcePage: (page: number) => void;
}) {
  if (!items.length)
    return (
      <ContentState
        title="No reviewed figures"
        message="This publication does not expose any reviewed figures."
      />
    );
  return (
    <section className="content-collection">
      <header>
        <span className="eyebrow">Figures</span>
        <h2>Reviewed figures and diagrams</h2>
      </header>
      <div className="figure-grid">
        {items.map((item) => {
          const source = safeExternalAssetUrl(item.asset.url);
          return (
            <figure key={item.id} id={`block-${item.id}`}>
              {source ? (
                <img
                  src={source}
                  alt={item.content.alternative_text}
                  loading="lazy"
                />
              ) : (
                <div
                  className="asset-placeholder"
                  role="img"
                  aria-label={item.content.alternative_text}
                >
                  Reviewed figure unavailable
                </div>
              )}
              {item.content.caption && (
                <figcaption>{item.content.caption}</figcaption>
              )}
              {item.page_start && (
                <button
                  className="block-source"
                  onClick={() => onOpenSourcePage(item.page_start!)}
                >
                  Source page {sourcePages(item.page_start, item.page_end)}
                </button>
              )}
            </figure>
          );
        })}
      </div>
    </section>
  );
}

function AlgorithmsView({
  items,
  onOpenSourcePage,
}: {
  items: PublicGuidelineAlgorithm[];
  onOpenSourcePage: (page: number) => void;
}) {
  if (!items.length)
    return (
      <ContentState
        title="No reviewed algorithms"
        message="This publication does not expose a reviewed structured algorithm."
      />
    );
  return (
    <section className="content-collection">
      <header>
        <span className="eyebrow">Algorithms</span>
        <h2>Reviewed clinical pathways</h2>
        <p>
          These diagrams present published guidance and are not executable
          decision tools.
        </p>
      </header>
      {items.map((item) => (
        <article key={item.id} id={`block-${item.id}`}>
          <StructuredAlgorithm content={item.content} />
          {item.page_start && (
            <button
              className="block-source"
              onClick={() => onOpenSourcePage(item.page_start!)}
            >
              Source page {sourcePages(item.page_start, item.page_end)}
            </button>
          )}
        </article>
      ))}
    </section>
  );
}

function ContentState({ title, message }: { title: string; message: string }) {
  return (
    <div className="library-state">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}

function publicationIdentity(manifest: PublicGuidelineManifest) {
  return `${manifest.guideline_id}:${manifest.version_id}:${manifest.package_version}:${manifest.checksum}`;
}

function tableFromBlock(block: PublicGuidelineBlock): PublicGuidelineTable {
  return {
    id: block.id, section_id: block.section_id, sort_order: block.sort_order,
    page_start: block.page_start, page_end: block.page_end,
    content: {
      type: "table",
      title: typeof block.content.title === "string" ? block.content.title : undefined,
      columns: Array.isArray(block.content.columns) ? block.content.columns.map(String) : [],
      rows: Array.isArray(block.content.rows) ? block.content.rows.map((row) => Array.isArray(row) ? row.map(String) : []) : [],
      footnotes: Array.isArray(block.content.footnotes) ? block.content.footnotes.map(String) : [],
    },
  };
}

function algorithmFromBlock(block: PublicGuidelineBlock): PublicGuidelineAlgorithm {
  const nodes = Array.isArray(block.content.nodes) ? block.content.nodes : [];
  return {
    id: block.id, section_id: block.section_id, sort_order: block.sort_order,
    page_start: block.page_start, page_end: block.page_end,
    content: {
      type: "algorithm",
      title: typeof block.content.title === "string" ? block.content.title : undefined,
      nodes: nodes.filter((node): node is Record<string, unknown> => typeof node === "object" && node !== null).map((node) => ({
        id: String(node.id ?? ""), label: String(node.label ?? ""), kind: String(node.kind ?? ""),
        next: Array.isArray(node.next) ? node.next.map(String) : undefined,
      })),
    },
  };
}

function Meta({ label, value }: { label: string; value?: string }) {
  return value ? (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  ) : null;
}
function ReaderMessage({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="reader-message">
      <Brand />
      <h1>{title}</h1>
      <p>{message}</p>
      {children}
      <Link to="/">Return to guideline library</Link>
    </main>
  );
}

function availableViews(data: ReaderData): ReaderView[] {
  const views: ReaderView[] = data.markdown?.content.trim()
    ? ["read", "overview"]
    : ["overview"];
  if (data.manifest?.has_chapters && data.sections.length)
    views.push("chapters");
  if (data.manifest?.has_tables) views.push("tables");
  if (data.manifest?.has_figures) views.push("figures");
  if (data.manifest?.has_algorithms) views.push("algorithms");
  return views;
}
function sectionDisplayState(
  state: SectionState,
  selectedId: string,
  sections: PublicGuidelineSection[],
): SectionDisplayState {
  if (!selectedId) return { status: "idle" };
  if (!sections.some((section) => section.id === selectedId))
    return { status: "error", sectionId: selectedId };
  if (state.status !== "idle" && state.sectionId === selectedId) return state;
  return { status: "loading" };
}
function parseView(value: string | null): ReaderView {
  return (
    [
      "read",
      "overview",
      "chapters",
      "tables",
      "figures",
      "algorithms",
    ] as ReaderView[]
  ).includes(value as ReaderView)
    ? (value as ReaderView)
    : "read";
}
function viewLabel(view: ReaderView) {
  return view === "read"
    ? "Read"
    : view === "chapters"
      ? "Chapters"
      : view.charAt(0).toUpperCase() + view.slice(1);
}
function qualityLabel(value?: string) {
  return value ? value.replaceAll("_", " ") : "Compatibility mode";
}
function sourcePages(start?: number, end?: number) {
  return start
    ? `Page${end && end !== start ? "s" : ""} ${end && end !== start ? `${start}–${end}` : start}`
    : "";
}
function formatDate(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        parsed,
      );
}
function safeExternalAssetUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : undefined;
}
async function openOriginal(id: string, page?: number) {
  try {
    const asset = await getPublicGuidelineOriginal(id);
    const url = new URL(asset.url);
    if (page) url.hash = `page=${page}`;
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  } catch {
    window.alert(
      "The original document is currently unavailable. Please try again.",
    );
  }
}
function updateMetaDescription(description: string) {
  let element = document.querySelector<HTMLMetaElement>(
    'meta[name="description"]',
  );
  if (!element) {
    element = document.createElement("meta");
    element.name = "description";
    document.head.appendChild(element);
  }
  element.content =
    description || "Published clinical guidance from MediGuide.";
}
function openCitation(
  citation: PublicAICitation,
  sections: PublicGuidelineSection[],
  selectSection: (id: string) => void,
  openSource: () => void,
) {
  if (
    citation.section_id &&
    sections.some((section) => section.id === citation.section_id)
  ) {
    selectSection(citation.section_id);
    // The section may still need to be fetched. The reader's hash effect waits
    // for that request and scrolls once the cited block exists in the DOM.
    if (citation.block_id)
      window.location.hash = `block-${encodeURIComponent(citation.block_id)}`;
    return;
  }
  if (citation.page_start) openSource();
}
