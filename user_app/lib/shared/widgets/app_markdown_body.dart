import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:user_app/core/utils/app_message.dart';

/// The single inline Markdown renderer for user-visible API and publication
/// content. Use this instead of passing Markdown-bearing content to [Text].
class AppMarkdownBody extends StatelessWidget {
  const AppMarkdownBody({
    super.key,
    required this.data,
    this.style,
    this.selectable = true,
    this.compact = false,
  });

  final String data;
  final TextStyle? style;
  final bool selectable;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textStyle = style ?? theme.textTheme.bodyMedium;
    final sheet = MarkdownStyleSheet.fromTheme(theme).copyWith(
      p: textStyle,
      listBullet: textStyle,
      tableBody: textStyle,
      a: textStyle?.copyWith(
        color: theme.colorScheme.primary,
        decoration: TextDecoration.underline,
        decorationColor: theme.colorScheme.primary,
      ),
      blockSpacing: compact ? 4 : 8,
      pPadding: EdgeInsets.zero,
    );

    return MarkdownBody(
      data: data.trim(),
      selectable: selectable,
      fitContent: true,
      styleSheet: sheet,
      onTapLink: (_, href, _) => _openLink(context, href),
    );
  }
}

Future<void> _openLink(BuildContext context, String? value) async {
  final uri = Uri.tryParse(value?.trim() ?? '');
  if (uri == null || uri.scheme != 'https') {
    AppMessage.warning(context, 'This link is unavailable.');
    return;
  }

  try {
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && context.mounted) {
      AppMessage.error(context, 'Unable to open this link.');
    }
  } catch (_) {
    if (context.mounted) {
      AppMessage.error(context, 'Unable to open this link.');
    }
  }
}
