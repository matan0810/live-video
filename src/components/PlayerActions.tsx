import { API_URL } from '../api/client';
import type { Channel } from '../channels';
import { withChannelParam } from '../channels/channelLink';
import { isCustomChannelId } from '../channels/customChannels';
import { useI18n } from '../i18n/context';
import { IconButton } from './IconButton';
import { GridIcon } from './icons';
import { ReportButton } from './ReportButton';
import { ShareButton } from './ShareButton';

interface PlayerActionsProps {
  channel: Channel;
  /** False for radio, which has no picture to put in a grid. */
  canMultiView: boolean;
  onStartMultiView: () => void;
}

/**
 * The buttons under the video: multi-view, and for channels from the list (not the
 * viewer's own) report and share.
 */
export function PlayerActions({ channel, canMultiView, onStartMultiView }: PlayerActionsProps) {
  const { t } = useI18n();
  return (
    <>
      {canMultiView && (
        <IconButton label={t.multiView} onClick={onStartMultiView}>
          <GridIcon />
        </IconButton>
      )}
      {!isCustomChannelId(channel.id) && (
        <>
          {API_URL && <ReportButton channel={channel} />}
          <ShareButton
            title={channel.name}
            url={withChannelParam(window.location.href, channel.id)}
          />
        </>
      )}
    </>
  );
}
