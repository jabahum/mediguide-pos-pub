import 'package:flutter/material.dart';
import 'package:user_app/core/constants/app_spacing.dart';
import 'package:user_app/features/guidelines/data/models/guideline_publication.dart';
import 'package:user_app/features/guidelines/presentation/utils/document_reader_kind.dart';
import 'package:user_app/features/guidelines/presentation/widgets/publication_block_view.dart';
import 'package:user_app/features/guidelines/presentation/widgets/publication_guideline_page_empty_section.dart';
import 'package:user_app/shared/widgets/app_markdown_body.dart';

/// Kind-specific navigation around the same approved, source-linked blocks.
class DocumentKindReader extends StatefulWidget {
  const DocumentKindReader({
    super.key,
    required this.content,
    required this.kind,
    required this.onSection,
    required this.onOpenOriginal,
    this.initialSectionId,
  });

  final GuidelinePublicationContent content;
  final DocumentReaderKind kind;
  final String? initialSectionId;
  final ValueChanged<String> onSection;
  final VoidCallback onOpenOriginal;

  @override
  State<DocumentKindReader> createState() => _DocumentKindReaderState();
}

class _DocumentKindReaderState extends State<DocumentKindReader> {
  final _readSections = <String>{};
  final _scroll = ScrollController();
  final _sectionKeys = <String, GlobalKey>{};
  bool _initialNavigationScheduled = false;
  late String? _selectedId = widget.initialSectionId;

  @override
  void didUpdateWidget(DocumentKindReader oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialSectionId != widget.initialSectionId) {
      _selectedId = widget.initialSectionId;
    }
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _select(String id) {
    setState(() => _selectedId = id);
    widget.onSection(id);
    if (widget.kind == DocumentReaderKind.procedure ||
        widget.kind == DocumentReaderKind.training) {
      if (_scroll.hasClients) _scroll.jumpTo(0);
    } else {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        final target = _sectionKeys[id]?.currentContext;
        if (target != null) Scrollable.ensureVisible(target);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final content = widget.content;
    final sections = [...content.readerSections]
      ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
    if (!_initialNavigationScheduled && _selectedId != null) {
      _initialNavigationScheduled = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _select(_selectedId!);
      });
    }
    final focused =
        widget.kind == DocumentReaderKind.procedure ||
        widget.kind == DocumentReaderKind.training;
    final selectedIndex = sections.indexWhere((s) => s.id == _selectedId);
    final index = selectedIndex < 0 ? 0 : selectedIndex;
    final visible = focused && sections.isNotEmpty
        ? [sections[index]]
        : sections;

    return Column(
      children: [
        if (focused && sections.isNotEmpty)
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: DropdownButtonFormField<String>(
              key: ValueKey(sections[index].id),
              initialValue: sections[index].id,
              isExpanded: true,
              decoration: InputDecoration(
                labelText: widget.kind == DocumentReaderKind.training
                    ? 'Publication topics'
                    : 'Procedure sections',
                border: const OutlineInputBorder(),
              ),
              items: [
                for (final section in sections)
                  DropdownMenuItem(
                    value: section.id,
                    child: Text(section.title, overflow: TextOverflow.ellipsis),
                  ),
              ],
              onChanged: (id) {
                if (id != null) _select(id);
              },
            ),
          ),
        Expanded(
          child: ListView(
            controller: _scroll,
            padding: AppSpacing.pagePadding,
            children: [
              Text(
                widget.kind.label,
                style: Theme.of(context).textTheme.labelLarge,
              ),
              AppSpacing.gapSm,
              Text(
                content.publication.title,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              if (content.publication.description.isNotEmpty) ...[
                AppSpacing.gapSm,
                AppMarkdownBody(
                  data: content.publication.description,
                  compact: true,
                ),
              ],
              if (content.manifest.recommendedMode ==
                  GuidelineReaderMode.partial)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                  child: Text(
                    'Partially reviewed content. Verify the original document for sections without approved content.',
                  ),
                ),
              if (widget.kind == DocumentReaderKind.checklist) ...[
                AppSpacing.gapMd,
                Text(
                  '${_readSections.length} of ${sections.where((s) => content.displayBlocksFor(s).isNotEmpty).length} sections read',
                ),
                const Text(
                  'Reading marks last for this session and do not record clinical task completion.',
                ),
                if (_readSections.isNotEmpty)
                  TextButton(
                    onPressed: () => setState(_readSections.clear),
                    child: const Text('Reset reading marks'),
                  ),
              ],
              AppSpacing.gapMd,
              if (sections.isEmpty) _empty(const []),
              for (final section in visible) _section(context, section),
              if (focused && sections.isNotEmpty)
                Wrap(
                  spacing: AppSpacing.sm,
                  children: [
                    OutlinedButton(
                      onPressed: index > 0
                          ? () => _select(sections[index - 1].id)
                          : null,
                      child: const Text('Previous section'),
                    ),
                    FilledButton(
                      onPressed: index + 1 < sections.length
                          ? () => _select(sections[index + 1].id)
                          : null,
                      child: const Text('Next section'),
                    ),
                  ],
                ),
              const SizedBox(height: 96),
            ],
          ),
        ),
      ],
    );
  }

  Widget _section(BuildContext context, PublicationSection section) {
    final content = widget.content;
    final blocks = content.displayBlocksFor(section);
    final body = Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!content.isDocumentTitleWrapper(section))
            Text(section.title, style: Theme.of(context).textTheme.titleLarge),
          if (widget.kind == DocumentReaderKind.checklist && blocks.isNotEmpty)
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Section read'),
              value: _readSections.contains(section.id),
              onChanged: (checked) {
                setState(() {
                  if (checked == true) {
                    _readSections.add(section.id);
                  } else {
                    _readSections.remove(section.id);
                  }
                });
                widget.onSection(section.id);
              },
            ),
          AppSpacing.gapSm,
          if (blocks.isEmpty) _empty(_descendants(section.id)),
          for (final block in blocks) ...[
            PublicationBlockView(
              block: block,
              guidelineId: content.publication.id,
            ),
            AppSpacing.gapMd,
          ],
        ],
      ),
    );
    return Padding(
      key: _sectionKeys.putIfAbsent(section.id, GlobalKey.new),
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: widget.kind == DocumentReaderKind.reference
          ? body
          : Card(child: body),
    );
  }

  List<PublicationSection> _descendants(String id) {
    final ids = <String>{id};
    var changed = true;
    while (changed) {
      changed = false;
      for (final section in widget.content.sections) {
        if (ids.contains(section.parentId) && ids.add(section.id)) {
          changed = true;
        }
      }
    }
    return widget.content.readerSections
        .where(
          (section) =>
              section.id != id &&
              ids.contains(section.id) &&
              widget.content.displayBlocksFor(section).isNotEmpty,
        )
        .toList();
  }

  Widget _empty(List<PublicationSection> descendants) =>
      PublicationEmptyReviewedSection(
        hasOriginalDocument: widget.content.manifest.hasOriginalPdf,
        reviewedDescendants: descendants,
        onSection: _select,
        onOpenOriginal: widget.onOpenOriginal,
      );
}
