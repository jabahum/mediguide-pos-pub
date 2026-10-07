import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:responsive_framework/responsive_framework.dart';
import 'package:user_app/app/providers/app_providers.dart';
import 'package:user_app/core/network/api_client.dart';
import 'package:user_app/core/storage/local_cache_service.dart';
import 'package:user_app/features/discovery/data/repositories/discovery_repository.dart';
import 'package:user_app/features/discovery/presentation/screens/discovery_pages.dart';
import 'package:user_app/features/discovery/presentation/widgets/discovery_widgets.dart';
import 'helpers/test_local_store.dart';

class _Cache extends LocalCacheService {
  _Cache(super.database);
  Map<String, dynamic>? saved;
  @override
  Future<void> put({
    required String type,
    required String id,
    required Map<String, dynamic> data,
    String scope = 'public',
    String searchableText = '',
    Map<String, dynamic>? metadata,
    String? version,
    DateTime? remoteUpdatedAt,
    Duration? ttl,
  }) async {
    saved = data;
  }

  @override
  Future<Map<String, dynamic>?> get({
    required String type,
    required String id,
    String scope = 'public',
  }) async => saved;
}

class _Api extends BackendApiService {
  final initial = Completer<Map<String, dynamic>>();
  bool fail = false;
  int calls = 0;
  @override
  Future<Map<String, dynamic>> requestJson(
    String path, {
    required String method,
    Map<String, dynamic>? body,
    Map<String, String>? query,
    bool includeAuth = true,
  }) async {
    expect(includeAuth, isFalse);
    calls++;
    if (fail) throw StateError('Connection unavailable');
    if (calls == 1) return initial.future;
    return {
      'data': {
        'items': query?['search'] == null
            ? [
                {
                  'id': 'one',
                  'name': 'Malaria',
                  'slug': 'malaria',
                  'description': 'Reviewed clinical guidance',
                },
              ]
            : [],
      },
    };
  }
}

Widget _host(
  Widget page,
  DiscoveryRepository repository, {
  double textScale = 1,
}) => ProviderScope(
  overrides: [
    discoveryRepositoryProvider.overrideWithValue(repository),
    diseaseTaxonomyEnabledProvider.overrideWithValue(true),
    diseaseHubsEnabledProvider.overrideWithValue(true),
    genericHubsEnabledProvider.overrideWithValue(true),
  ],
  child: MaterialApp(
    builder: (context, child) => ResponsiveBreakpoints.builder(
      child: MediaQuery(
        data: MediaQuery.of(
          context,
        ).copyWith(textScaler: TextScaler.linear(textScale)),
        child: child!,
      ),
      breakpoints: const [
        Breakpoint(start: 0, end: 450, name: MOBILE),
        Breakpoint(start: 451, end: double.infinity, name: TABLET),
      ],
    ),
    home: page,
  ),
);

void main() {
  for (final hubs in [true, false]) {
    testWidgets(
      '${hubs ? 'hub' : 'disease'} directory renders loading, results and recoverable search without blanking',
      (tester) async {
        tester.view.physicalSize = const Size(390, 844);
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        final store = TestLocalStore();
        addTearDown(store.close);
        final api = _Api();
        await tester.pumpWidget(
          _host(
            hubs
                ? const ContentHubDirectoryPage()
                : const DiseaseDirectoryPage(),
            DiscoveryRepository(api, _Cache(store.database)),
          ),
        );
        await tester.pump(const Duration(milliseconds: 100));
        expect(find.byType(DiscoverySkeleton), findsOneWidget);
        expect(find.byType(TextField), findsOneWidget);
        expect(tester.takeException(), isNull);

        api.initial.complete({
          'data': {
            'items': [
              {
                'id': 'one',
                'name': 'Malaria',
                'slug': 'malaria',
                'description': 'Reviewed clinical guidance',
              },
            ],
          },
        });
        await tester.pumpAndSettle();
        expect(find.text('Malaria'), findsOneWidget);
        await tester.enterText(find.byType(TextField), 'missing');
        await tester.pump(const Duration(milliseconds: 350));
        await tester.pumpAndSettle();
        expect(
          find.text(
            hubs ? 'No matching content hubs' : 'No matching conditions',
          ),
          findsOneWidget,
        );
        await tester.tap(find.byTooltip('Clear search'));
        await tester.pumpAndSettle();
        expect(find.text('Malaria'), findsOneWidget);
        expect(
          tester.widget<TextField>(find.byType(TextField)).controller!.text,
          isEmpty,
        );
        expect(tester.takeException(), isNull);
      },
    );
  }

  for (final hubs in [true, false]) {
    testWidgets(
      '${hubs ? 'hub' : 'disease'} empty directory fits a small phone with 200 percent text',
      (tester) async {
        tester.view.physicalSize = const Size(320, 640);
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        final store = TestLocalStore();
        addTearDown(store.close);
        final api = _Api();
        await tester.pumpWidget(
          _host(
            hubs
                ? const ContentHubDirectoryPage()
                : const DiseaseDirectoryPage(),
            DiscoveryRepository(api, _Cache(store.database)),
            textScale: 2,
          ),
        );
        api.initial.complete({
          'data': {'items': []},
        });
        await tester.pumpAndSettle();
        expect(
          find.text(hubs ? 'No content hubs yet' : 'No conditions yet'),
          findsOneWidget,
        );
        for (
          var attempt = 0;
          attempt < 6 && tester.getCenter(find.text('Refresh')).dy > 580;
          attempt++
        ) {
          await tester.drag(
            find.byType(CustomScrollView),
            const Offset(0, -400),
          );
          await tester.pumpAndSettle();
        }
        await tester.tap(find.text('Refresh'));
        await tester.pumpAndSettle();
        expect(find.text('Malaria'), findsOneWidget);
        expect(tester.takeException(), isNull);
      },
    );
  }

  testWidgets(
    'a failed cold load shows an error and retry restores the directory',
    (tester) async {
      final store = TestLocalStore();
      addTearDown(store.close);
      final api = _Api()..fail = true;
      await tester.pumpWidget(
        _host(
          const ContentHubDirectoryPage(),
          DiscoveryRepository(api, _Cache(store.database)),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Check your connection and try again.'), findsOneWidget);
      expect(find.text('No content hubs yet'), findsNothing);
      api.fail = false;
      await tester.ensureVisible(find.text('Try Again'));
      await tester.tap(find.text('Try Again'));
      await tester.pumpAndSettle();
      expect(find.text('Malaria'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );
}
