import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:responsive_framework/responsive_framework.dart';
import 'package:user_app/app/providers/app_providers.dart';
import 'package:user_app/app/router/route_names.dart';
import 'package:user_app/app/theme/app_theme.dart';
import 'package:user_app/core/network/api_client.dart';
import 'package:user_app/features/authentication/presentation/controllers/auth_controller.dart';
import 'package:user_app/features/authentication/presentation/controllers/auth_state.dart';
import 'package:user_app/features/downloads/data/models/offline_download.dart';
import 'package:user_app/features/downloads/presentation/controllers/guideline_downloads_controller.dart';
import 'package:user_app/features/guidelines/data/models/guideline_publication.dart';
import 'package:user_app/features/guidelines/data/models/reading_progress.dart';
import 'package:user_app/features/guidelines/data/repositories/progress_usage_repository.dart';
import 'package:user_app/features/guidelines/presentation/controllers/publication_guideline_controller.dart';
import 'package:user_app/features/guidelines/presentation/screens/publication_guideline_page.dart';
import 'helpers/test_local_store.dart';

class _Guest extends AuthController {
  @override
  Future<AuthState> build() async => const AuthState.unauthenticated();
}

class _Downloads extends GuidelineDownloadsController {
  @override
  Future<List<OfflineDownload>> build() async => const [];
}

GuidelinePublicationContent _sample(
  String slug,
  String name, {
  bool original = true,
  bool partial = false,
}) => GuidelinePublicationContent(
  publication: GuidelinePublication(
    id: 'doc',
    title: 'Sample $name',
    description: 'A single published description.',
    sourceOrganization: 'Publishing organization',
    publicationDate: '2026-10-13',
    reviewDate: '2027-10-13',
    language: 'en',
    version: '1.0',
    documentKind: PublicDocumentKind(
      slug: slug,
      name: name,
      publishAsUploaded: slug == 'form',
      publishAsLink: slug == 'link',
    ),
    externalUrl: slug == 'link' ? 'https://example.org/resource' : '',
  ),
  manifest: GuidelineManifest(
    guidelineId: 'doc',
    versionId: 'v1',
    hasChapters: slug != 'form' && slug != 'link',
    hasOriginalPdf: slug != 'link' && original,
    hasTables: slug != 'form' && slug != 'link',
    sectionCount: 2,
    reviewedSectionCount: partial ? 1 : 2,
    recommendedMode: partial
        ? GuidelineReaderMode.partial
        : GuidelineReaderMode.structured,
  ),
  sections: slug == 'form' || slug == 'link'
      ? const []
      : const [
          PublicationSection(
            id: 'first',
            title: 'Opening section',
            sortOrder: 0,
          ),
          PublicationSection(id: 'second', title: 'Next section', sortOrder: 1),
        ],
  blocks: slug == 'form' || slug == 'link'
      ? const []
      : const [
          GuidelineBlock.paragraph(
            id: 'p',
            sectionId: 'first',
            sortOrder: 0,
            text: 'Published sample content.',
          ),
          GuidelineBlock.table(
            id: 't',
            sectionId: 'second',
            sortOrder: 1,
            payload: GuidelineTablePayload(
              title: 'Sample matrix',
              columns: ['Item'],
              rows: [
                ['Example'],
              ],
            ),
          ),
        ],
);

void main() {
  Future<GoRouter> pumpOverview(
    WidgetTester tester,
    GuidelinePublicationContent content, {
    double width = 430,
    double scale = 1,
    bool dark = false,
    ReadingProgress? progress,
    Completer<GuidelinePublicationContent>? pending,
  }) async {
    final store = TestLocalStore();
    addTearDown(store.close);
    tester.view.physicalSize = Size(width, 1000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final router = GoRouter(
      routes: [
        GoRoute(
          path: '/',
          builder: (_, _) => const PublicationGuidelinePage(guidelineId: 'doc'),
        ),
        GoRoute(
          path: AppRoutes.publicGuidelineReader,
          builder: (_, state) => Scaffold(body: Text('Reader: ${state.uri}')),
        ),
        GoRoute(
          path: AppRoutes.publicGuidelineTable,
          builder: (_, state) => const Scaffold(body: Text('Table opened')),
        ),
      ],
    );
    addTearDown(router.dispose);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authControllerProvider.overrideWith(_Guest.new),
          publicationGuidelineProvider('doc').overrideWith(
            (_) async => pending == null ? content : pending.future,
          ),
          publicationGuidelineSummaryProvider('doc').overrideWith(
            (_) async => pending == null
                ? content
                : GuidelinePublicationContent(
                    publication: content.publication,
                    manifest: content.manifest,
                    sections: const [],
                    blocks: const [],
                  ),
          ),
          publicationReadingProgressProvider(
            'doc',
          ).overrideWith((_) async => progress),
          guidelineDownloadsControllerProvider.overrideWith(_Downloads.new),
          usageRepositoryProvider.overrideWithValue(
            UsageRepository(BackendApiService(), store.cache, () => null),
          ),
        ],
        child: MaterialApp.router(
          theme: dark ? AppTheme.dark : AppTheme.light,
          routerConfig: router,
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(
              context,
            ).copyWith(textScaler: TextScaler.linear(scale)),
            child: ResponsiveBreakpoints.builder(
              breakpoints: const [
                Breakpoint(start: 0, end: 450, name: MOBILE),
                Breakpoint(start: 451, end: 900, name: TABLET),
                Breakpoint(start: 901, end: double.infinity, name: DESKTOP),
              ],
              child: child!,
            ),
          ),
        ),
      ),
    );
    if (pending == null) {
      await tester.pumpAndSettle();
    } else {
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
    }
    return router;
  }

  const cases = [
    ('guideline', 'Guideline', 'Read guideline'),
    ('manual', 'Manual', 'Read manual'),
    ('framework', 'Framework', 'Explore framework'),
    ('sop', 'SOP', 'View procedure'),
    ('checklist', 'Checklist', 'View checklist'),
    ('case_definition', 'Case Definition', 'View definitions'),
    ('training_material', 'Training Material', 'Start reading'),
    ('policy', 'Policy', 'Read policy'),
    ('form', 'Form', 'Open form'),
    ('link', 'Link', 'Open website'),
  ];
  for (final (slug, name, action) in cases) {
    testWidgets(
      '$name overview uses the correct action at 200% text on a narrow phone',
      (tester) async {
        await pumpOverview(
          tester,
          _sample(slug, name),
          width: 320,
          scale: 2,
          dark: true,
        );
        expect(find.text(action), findsOneWidget);
        expect(find.text('A single published description.'), findsOneWidget);
        expect(find.text('Key Points'), findsNothing);
        if (slug == 'form' || slug == 'link') {
          expect(find.text('Chapters'), findsNothing);
          expect(find.text('Tables'), findsNothing);
        }
        if (slug == 'link') {
          expect(find.byTooltip('Download for offline use'), findsNothing);
        }
        await tester.scrollUntilVisible(
          find.text('Document details'),
          250,
          scrollable: find.byType(Scrollable).first,
        );
        expect(find.text('English'), findsOneWidget);
        expect(tester.takeException(), isNull);
        await tester.pumpWidget(const SizedBox.shrink());
      },
    );
  }

  testWidgets('resume action opens the saved section', (tester) async {
    await pumpOverview(
      tester,
      _sample('manual', 'Manual'),
      progress: const ReadingProgress(
        id: 'progress',
        guidelineId: 'doc',
        currentSection: 'second',
        progressPercentage: 0.5,
      ),
    );
    await tester.tap(find.byKey(const Key('document-primary-action')));
    await tester.pumpAndSettle();
    expect(
      find.text('Reader: /public/guidelines/doc/read?section=second'),
      findsOneWidget,
    );
  });

  testWidgets('framework contents and tables open real destinations', (
    tester,
  ) async {
    await pumpOverview(tester, _sample('framework', 'Framework'));
    await tester.scrollUntilVisible(
      find.text('Tables'),
      250,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Framework areas'), findsOneWidget);
    await tester.tap(find.text('Tables'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Sample matrix'));
    await tester.tap(find.text('Sample matrix'));
    await tester.pumpAndSettle();
    expect(find.text('Table opened'), findsOneWidget);
  });

  testWidgets('unavailable form disables its primary action', (tester) async {
    await pumpOverview(tester, _sample('form', 'Form', original: false));
    final button = tester.widget<FilledButton>(
      find.byKey(const Key('document-primary-action')),
    );
    expect(button.onPressed, isNull);
    expect(
      find.text('The original file is currently unavailable.'),
      findsOneWidget,
    );
  });

  testWidgets(
    'metadata stays usable while contents load and exposes retry on failure',
    (tester) async {
      final pending = Completer<GuidelinePublicationContent>();
      await pumpOverview(tester, _sample('sop', 'SOP'), pending: pending);
      expect(find.text('Sample SOP'), findsWidgets);
      expect(find.text('Loading contents…'), findsOneWidget);
      pending.completeError(StateError('Offline'));
      await tester.pumpAndSettle();
      await tester.scrollUntilVisible(
        find.text('Retry contents'),
        250,
        scrollable: find.byType(Scrollable).first,
      );
      expect(find.text('Retry contents'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );
}
