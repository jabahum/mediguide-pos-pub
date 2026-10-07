import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:user_app/core/constants/app_spacing.dart';

/// Shared directory layout matching the app's reference and browse pages.
class DiscoveryDirectoryScaffold extends StatelessWidget {
  const DiscoveryDirectoryScaffold({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.browseTitle,
    required this.description,
    required this.searchHint,
    required this.search,
    required this.onChanged,
    required this.onSubmitted,
    required this.onClear,
    required this.onRefresh,
    required this.child,
  });

  final String title, subtitle, browseTitle, description, searchHint;
  final IconData icon;
  final TextEditingController search;
  final ValueChanged<String> onChanged;
  final VoidCallback onSubmitted, onClear;
  final Future<void> Function() onRefresh;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    return Scaffold(
      backgroundColor: colors.surface,
      appBar: AppBar(
        toolbarHeight:
            (MediaQuery.textScalerOf(context).scale(24) +
                    MediaQuery.textScalerOf(context).scale(14) +
                    12)
                .clamp(kToolbarHeight, double.infinity),
        titleSpacing: AppSpacing.md,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: text.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            Text(
              subtitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: text.bodySmall?.copyWith(color: colors.onSurfaceVariant),
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: onRefresh,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.all(AppSpacing.md),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: colors.surfaceContainerLow,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: colors.outlineVariant),
                      ),
                      child: Column(
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 42,
                                height: 42,
                                decoration: BoxDecoration(
                                  color: colors.primaryContainer,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(
                                  icon,
                                  color: colors.primary,
                                  size: 21,
                                ),
                              ),
                              AppSpacing.hGapMd,
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      browseTitle,
                                      style: text.titleSmall?.copyWith(
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      description,
                                      style: text.bodySmall?.copyWith(
                                        color: colors.onSurfaceVariant,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          AppSpacing.gapMd,
                          TextField(
                            controller: search,
                            textInputAction: TextInputAction.search,
                            onChanged: onChanged,
                            onSubmitted: (_) => onSubmitted(),
                            decoration: InputDecoration(
                              hintText: searchHint,
                              prefixIcon: const Icon(LucideIcons.search),
                              suffixIcon: search.text.isEmpty
                                  ? null
                                  : IconButton(
                                      tooltip: 'Clear search',
                                      onPressed: onClear,
                                      icon: const Icon(LucideIcons.x),
                                    ),
                              filled: true,
                              fillColor: colors.surface,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    AppSpacing.gapLg,
                    child,
                    AppSpacing.gapXxl,
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class DiscoveryDirectoryResults extends StatelessWidget {
  const DiscoveryDirectoryResults({
    super.key,
    required this.label,
    required this.count,
    required this.offline,
    required this.child,
  });
  final String label;
  final int count;
  final bool offline;
  final Widget child;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      if (offline) ...[
        const Card(
          child: ListTile(
            leading: Icon(LucideIcons.cloudOff),
            title: Text('Showing saved content'),
            subtitle: Text('Pull down to try connecting again.'),
          ),
        ),
        AppSpacing.gapMd,
      ],
      Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
          ),
          const SizedBox(width: 8),
          Text('$count', style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
      AppSpacing.gapSm,
      child,
    ],
  );
}
