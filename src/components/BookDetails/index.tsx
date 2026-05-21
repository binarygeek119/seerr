import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import type { PlayButtonLink } from '@app/components/Common/PlayButton';
import PlayButton from '@app/components/Common/PlayButton';
import Tooltip from '@app/components/Common/Tooltip';
import ManageSlideOver from '@app/components/ManageSlideOver';
import RequestButton from '@app/components/RequestButton';
import StatusBadge from '@app/components/StatusBadge';
import useDeepLinks from '@app/hooks/useDeepLinks';
import useSettings from '@app/hooks/useSettings';
import { Permission, useUser } from '@app/hooks/useUser';
import ErrorPage from '@app/pages/_error';
import defineMessages from '@app/utils/defineMessages';
import { refreshIntervalHelper } from '@app/utils/refreshIntervalHelper';
import { CogIcon, PlayIcon } from '@heroicons/react/24/outline';
import { IssueStatus } from '@server/constants/issue';
import { MediaStatus } from '@server/constants/media';
import { MediaServerType } from '@server/constants/server';
import type { BookDetails as BookDetailsType } from '@server/models/Book';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages('components.BookDetails', {
  play: 'Play on {mediaServerName}',
  managebook: 'Manage Book',
  byauthor: 'by {name}',
});

interface BookDetailsProps {
  book?: BookDetailsType;
}

const BookDetails = ({ book }: BookDetailsProps) => {
  const settings = useSettings();
  const { hasPermission } = useUser();
  const router = useRouter();
  const intl = useIntl();
  const [showManager, setShowManager] = useState(false);

  const bookId =
    typeof router.query.bookId === 'string' ? router.query.bookId : undefined;

  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<BookDetailsType>(
    bookId ? `/api/v1/book/${encodeURIComponent(bookId)}` : null,
    {
      fallbackData: book,
      refreshInterval: refreshIntervalHelper(
        {
          downloadStatus: book?.mediaInfo?.downloadStatus,
          downloadStatus4k: undefined,
        },
        15000
      ),
    }
  );

  useEffect(() => {
    setShowManager(router.query.manage == '1' ? true : false);
  }, [router.query.manage]);

  const { mediaUrl: plexUrl } = useDeepLinks({
    mediaUrl: data?.mediaInfo?.mediaUrl,
    mediaUrl4k: data?.mediaInfo?.mediaUrl4k,
    iOSPlexUrl: data?.mediaInfo?.iOSPlexUrl,
    iOSPlexUrl4k: data?.mediaInfo?.iOSPlexUrl4k,
  });

  const closeManager = useCallback(() => {
    setShowManager(false);
    router.push({
      pathname: router.pathname,
      query: { bookId: router.query.bookId },
    });
  }, [router]);

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <ErrorPage statusCode={404} />;
  }

  const mediaLinks: PlayButtonLink[] = [];

  if (
    plexUrl &&
    hasPermission([Permission.REQUEST, Permission.REQUEST_BOOK], {
      type: 'or',
    })
  ) {
    const mediaServerName =
      settings.currentSettings.mediaServerType === MediaServerType.EMBY
        ? 'Emby'
        : settings.currentSettings.mediaServerType === MediaServerType.PLEX
          ? 'Plex'
          : 'Jellyfin';
    mediaLinks.push({
      text: intl.formatMessage(messages.play, { mediaServerName }),
      url: plexUrl,
      svg: <PlayIcon />,
    });
  }

  const authorLine = data.author.authorName
    ? intl.formatMessage(messages.byauthor, { name: data.author.authorName })
    : '';

  return (
    <div
      className="media-page"
      style={{
        height: 493,
      }}
    >
      <div className="media-page-bg-image">
        <CachedImage
          type="music"
          alt=""
          src={
            data.posterPath || '/images/jellyseerr_poster_not_found_square.png'
          }
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          fill
          priority
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(17, 24, 39, 0.47) 0%, rgba(17, 24, 39, 1) 100%)',
          }}
        />
      </div>
      <PageTitle
        title={authorLine ? `${data.title} ${authorLine}` : data.title}
      />
      <ManageSlideOver
        data={data}
        mediaType="book"
        onClose={closeManager}
        revalidate={() => revalidate()}
        show={showManager}
      />
      <div className="media-header">
        <div className="media-poster">
          <CachedImage
            type="music"
            src={
              data.posterPath ||
              '/images/jellyseerr_poster_not_found_square.png'
            }
            alt=""
            sizes="100vw"
            style={{ width: '100%', height: 'auto' }}
            width={600}
            height={600}
            priority
          />
        </div>
        <div className="media-title">
          <div className="media-status">
            <StatusBadge
              status={data.mediaInfo?.status}
              downloadItem={data.mediaInfo?.downloadStatus}
              title={data.title}
              inProgress={(data.mediaInfo?.downloadStatus ?? []).length > 0}
              foreignBookId={
                data.mediaInfo?.foreignBookId ?? data.foreignBookId
              }
              mediaType="book"
              serviceUrl={data.mediaInfo?.serviceUrl}
            />
            {settings.currentSettings.bookAudiobookEnabled &&
              hasPermission(
                [Permission.MANAGE_REQUESTS, Permission.REQUEST_BOOK],
                { type: 'or' }
              ) && (
                <StatusBadge
                  status={data.mediaInfo?.status4k}
                  downloadItem={data.mediaInfo?.downloadStatus4k}
                  title={data.title}
                  is4k
                  inProgress={
                    (data.mediaInfo?.downloadStatus4k ?? []).length > 0
                  }
                  foreignBookId={
                    data.mediaInfo?.foreignBookId ?? data.foreignBookId
                  }
                  mediaType="book"
                  serviceUrl={data.mediaInfo?.serviceUrl4k}
                />
              )}
          </div>
          <h1 data-testid="media-title">
            {data.title}
            {authorLine ? ` ${authorLine}` : ''}
          </h1>
        </div>
        <div className="media-actions">
          <PlayButton links={mediaLinks} />
          <RequestButton
            mediaType="book"
            media={data.mediaInfo}
            foreignBookId={data.foreignBookId}
            onUpdate={() => revalidate()}
          />
          {hasPermission(Permission.MANAGE_REQUESTS) &&
            data.mediaInfo &&
            (data.mediaInfo.jellyfinMediaId ||
              data.mediaInfo.jellyfinMediaId4k ||
              data.mediaInfo.status !== MediaStatus.UNKNOWN ||
              data.mediaInfo.status4k !== MediaStatus.UNKNOWN) && (
              <Tooltip content={intl.formatMessage(messages.managebook)}>
                <Button
                  buttonType="ghost"
                  onClick={() => setShowManager(true)}
                  className="relative ml-2 first:ml-0"
                >
                  <CogIcon className="!mr-0" />
                  {hasPermission(
                    [Permission.MANAGE_ISSUES, Permission.VIEW_ISSUES],
                    {
                      type: 'or',
                    }
                  ) &&
                    (data.mediaInfo?.issues ?? []).filter(
                      (issue) => issue.status === IssueStatus.OPEN
                    ).length > 0 && (
                      <>
                        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-600" />
                        <div className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-red-600" />
                      </>
                    )}
                </Button>
              </Tooltip>
            )}
        </div>
      </div>
      {data.overview ? (
        <div className="media-overview px-4 pt-4 text-gray-300">
          <p className="max-w-4xl whitespace-pre-wrap">{data.overview}</p>
        </div>
      ) : null}
    </div>
  );
};

export default BookDetails;
