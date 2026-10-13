import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:user_app/features/guidelines/data/models/guideline_publication.dart';
import 'package:user_app/features/guidelines/presentation/utils/document_reader_kind.dart';
import 'package:user_app/features/guidelines/presentation/widgets/document_kind_reader.dart';

const _sections = [
  PublicationSection(
    id: 'first',
    title: 'Published first section',
    sortOrder: 1,
  ),
  PublicationSection(
    id: 'second',
    title: 'Published second section',
    sortOrder: 2,
  ),
];
const _blocks = [
  GuidelineBlock.paragraph(
    id: 'a',
    sectionId: 'first',
    sortOrder: 1,
    text: 'First approved content',
  ),
  GuidelineBlock.paragraph(
    id: 'b',
    sectionId: 'second',
    sortOrder: 2,
    text: 'Second approved content',
  ),
];
GuidelinePublicationContent _content({
  bool partial = false,
  bool empty = false,
}) => GuidelinePublicationContent(
  publication: const GuidelinePublication(id: 'doc', title: 'Publication'),
  manifest: GuidelineManifest(
    guidelineId: 'doc',
    versionId: 'v1',
    hasOriginalPdf: true,
    recommendedMode: partial
        ? GuidelineReaderMode.partial
        : GuidelineReaderMode.structured,
  ),
  sections: _sections,
  blocks: empty ? const [] : _blocks,
);

void main() {
  test('seeded kinds select readers and unknown kinds fall back', () {
    const expected = {
      'guideline': DocumentReaderKind.guideline,
      'manual': DocumentReaderKind.guideline,
      'framework': DocumentReaderKind.reference,
      'form': DocumentReaderKind.uploaded,
      'sop': DocumentReaderKind.procedure,
      'ipc_protocol': DocumentReaderKind.procedure,
      'laboratory_protocol': DocumentReaderKind.procedure,
      'surveillance_protocol': DocumentReaderKind.procedure,
      'contact_tracing_guide': DocumentReaderKind.procedure,
      'treatment_protocol': DocumentReaderKind.procedure,
      'referral_protocol': DocumentReaderKind.procedure,
      'checklist': DocumentReaderKind.checklist,
      'case_definition': DocumentReaderKind.caseDefinition,
      'training_material': DocumentReaderKind.training,
      'communication_material': DocumentReaderKind.reference,
      'policy': DocumentReaderKind.reference,
      'situation_report_attachment': DocumentReaderKind.reference,
      'other': DocumentReaderKind.guideline,
      'custom': DocumentReaderKind.guideline,
      'IPC-Protocol': DocumentReaderKind.procedure,
    };
    for (final entry in expected.entries) {
      expect(
        DocumentReaderKind.forPublication(
          GuidelinePublication(
            id: 'doc',
            documentKind: PublicDocumentKind(slug: entry.key),
          ),
        ),
        entry.value,
        reason: entry.key,
      );
    }
    expect(
      DocumentReaderKind.forPublication(const GuidelinePublication(id: 'doc')),
      DocumentReaderKind.guideline,
    );
  });

  test('publication flags override slugs, including missing link URLs', () {
    for (final slug in ['sop', 'custom', 'form']) {
      final publication = GuidelinePublication(
        id: 'doc',
        documentKind: PublicDocumentKind(slug: slug, publishAsUploaded: true),
      );
      expect(
        DocumentReaderKind.forPublication(publication),
        DocumentReaderKind.uploaded,
      );
      expect(
        DocumentReaderKind.forPublication(
          publication.copyWith(
            documentKind: publication.documentKind!.copyWith(
              publishAsLink: true,
            ),
          ),
        ),
        DocumentReaderKind.link,
      );
    }
  });

  Future<void> pumpReader(
    WidgetTester tester,
    DocumentReaderKind kind, {
    String? section,
    bool partial = false,
    bool empty = false,
    ValueChanged<String>? onSection,
    VoidCallback? onOpen,
  }) => tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: DocumentKindReader(
          content: _content(partial: partial, empty: empty),
          kind: kind,
          initialSectionId: section,
          onSection: onSection ?? (_) {},
          onOpenOriginal: onOpen ?? () {},
        ),
      ),
    ),
  );

  for (final kind in [
    DocumentReaderKind.procedure,
    DocumentReaderKind.training,
  ]) {
    testWidgets(
      '${kind.name} supports deep links and previous/next navigation',
      (tester) async {
        final selected = <String>[];
        await pumpReader(
          tester,
          kind,
          section: 'second',
          onSection: selected.add,
        );
        await tester.pumpAndSettle();
        expect(find.text('Second approved content'), findsOneWidget);
        expect(find.text('First approved content'), findsNothing);
        await tester.tap(find.text('Previous section'));
        await tester.pumpAndSettle();
        expect(find.text('First approved content'), findsOneWidget);
        expect(selected.last, 'first');
        await tester.tap(find.text('Next section'));
        await tester.pumpAndSettle();
        expect(find.text('Second approved content'), findsOneWidget);
        expect(selected.last, 'second');
        expect(tester.takeException(), isNull);
      },
    );
  }

  testWidgets('checklist marks reset without altering content', (tester) async {
    await pumpReader(tester, DocumentReaderKind.checklist);
    await tester.pumpAndSettle();
    await tester.tap(find.byType(CheckboxListTile).first);
    await tester.pumpAndSettle();
    expect(find.text('1 of 2 sections read'), findsOneWidget);
    expect(find.text('First approved content'), findsOneWidget);
    await tester.tap(find.text('Reset reading marks'));
    await tester.pumpAndSettle();
    expect(find.text('0 of 2 sections read'), findsOneWidget);
  });

  testWidgets('case definitions use separate published section cards', (
    tester,
  ) async {
    await pumpReader(tester, DocumentReaderKind.caseDefinition);
    await tester.pumpAndSettle();
    expect(find.byType(Card), findsNWidgets(2));
    expect(find.text('First approved content'), findsOneWidget);
    expect(find.text('Second approved content'), findsOneWidget);
    expect(find.byType(CheckboxListTile), findsNothing);
  });

  testWidgets('partial empty references keep the original fallback', (
    tester,
  ) async {
    var opened = false;
    await pumpReader(
      tester,
      DocumentReaderKind.reference,
      partial: true,
      empty: true,
      onOpen: () => opened = true,
    );
    await tester.pumpAndSettle();
    expect(find.textContaining('Partially reviewed content.'), findsOneWidget);
    await tester.tap(find.text('Open original document').first);
    expect(opened, isTrue);
    expect(find.byType(Card), findsNothing);
  });
}
