import ButtonWithDropdown from '@app/components/Common/ButtonWithDropdown';
import RequestModal from '@app/components/RequestModal';
import MovieQualityPicker from '@app/components/RequestModal/MovieQualityPicker';
import { flagsFromQuality } from '@server/lib/movieRequestQuality';
import type { MovieRequestQuality } from '@server/lib/movieRequestQuality';
import useSettings from '@app/hooks/useSettings';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import {
  CheckIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { MediaRequestStatus, MediaStatus } from '@server/constants/media';
import type Media from '@server/entity/Media';
import type { MediaRequest } from '@server/entity/MediaRequest';
import axios from 'axios';
import { Transition } from '@headlessui/react';
import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { mutate } from 'swr';

const messages = defineMessages('components.RequestButton', {
  viewrequest: 'View Request',
  viewrequest4k: 'View 4K Request',
  viewrequest3d: 'View 3D Request',
  viewrequestaudiobook: 'View Audiobook Request',
  requestmore: 'Request More',
  requestmore4k: 'Request More in 4K',
  approverequest: 'Approve Request',
  approverequest4k: 'Approve 4K Request',
  declinerequest: 'Decline Request',
  declinerequest4k: 'Decline 4K Request',
  approverequests:
    'Approve {requestCount, plural, one {Request} other {{requestCount} Requests}}',
  declinerequests:
    'Decline {requestCount, plural, one {Request} other {{requestCount} Requests}}',
  approve4krequests:
    'Approve {requestCount, plural, one {4K Request} other {{requestCount} 4K Requests}}',
  decline4krequests:
    'Decline {requestCount, plural, one {4K Request} other {{requestCount} 4K Requests}}',
});

interface ButtonOption {
  id: string;
  text: string;
  action: () => void;
  svg?: React.ReactNode;
}

interface RequestButtonProps {
  mediaType: 'movie' | 'tv' | 'music' | 'book';
  onUpdate: () => void;
  tmdbId?: number;
  media?: Media;
  mbId?: string;
  foreignBookId?: string;
  isShowComplete?: boolean;
  is4kShowComplete?: boolean;
  /** From 3dmovielist.com — when false, hide the 3D request option */
  hasTheatrical3dVersion?: boolean;
}

const RequestButton = ({
  tmdbId,
  onUpdate,
  media,
  mediaType,
  mbId,
  foreignBookId,
  isShowComplete = false,
  is4kShowComplete = false,
  hasTheatrical3dVersion = false,
}: RequestButtonProps) => {
  const intl = useIntl();
  const settings = useSettings();
  const { user, hasPermission } = useUser();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRequest4kModal, setShowRequest4kModal] = useState(false);
  const [showQualityPicker, setShowQualityPicker] = useState(false);
  const [movieRequestIs4k, setMovieRequestIs4k] = useState(false);
  const [movieRequestIs3d, setMovieRequestIs3d] = useState(false);
  const [editRequest, setEditRequest] = useState(false);

  // All pending requests
  const activeRequests = useMemo(
    () =>
      media?.requests?.filter(
        (request) =>
          request.status === MediaRequestStatus.PENDING &&
          !request.is4k &&
          !request.is3d
      ) ?? [],
    [media?.requests]
  );
  const active4kRequests = useMemo(
    () =>
      media?.requests?.filter(
        (request) =>
          request.status === MediaRequestStatus.PENDING &&
          request.is4k &&
          !request.is3d
      ) ?? [],
    [media?.requests]
  );
  const active3dRequests = useMemo(
    () =>
      media?.requests?.filter(
        (request) =>
          request.status === MediaRequestStatus.PENDING && request.is3d
      ) ?? [],
    [media?.requests]
  );

  // Current user's pending request, or the first pending request
  const activeRequest = useMemo(() => {
    return activeRequests && activeRequests.length > 0
      ? (activeRequests.find(
          (request) => request.requestedBy.id === user?.id
        ) ?? activeRequests[0])
      : undefined;
  }, [activeRequests, user]);
  const active4kRequest = useMemo(() => {
    return active4kRequests && active4kRequests.length > 0
      ? (active4kRequests.find(
          (request) => request.requestedBy.id === user?.id
        ) ?? active4kRequests[0])
      : undefined;
  }, [active4kRequests, user]);
  const active3dRequest = useMemo(() => {
    return active3dRequests && active3dRequests.length > 0
      ? (active3dRequests.find(
          (request) => request.requestedBy.id === user?.id
        ) ?? active3dRequests[0])
      : undefined;
  }, [active3dRequests, user]);

  const openMovieRequest = (quality: MovieRequestQuality) => {
    const flags = flagsFromQuality(quality);
    setMovieRequestIs4k(flags.is4k);
    setMovieRequestIs3d(flags.is3d);
    setEditRequest(false);
    setShowQualityPicker(false);
    setShowRequestModal(true);
  };

  const modifyRequest = async (
    request: MediaRequest,
    type: 'approve' | 'decline'
  ) => {
    const response = await axios.post(`/api/v1/request/${request.id}/${type}`);

    if (response) {
      onUpdate();
      mutate('/api/v1/request/count');
    }
  };

  const modifyRequests = async (
    requests: MediaRequest[],
    type: 'approve' | 'decline'
  ): Promise<void> => {
    if (!requests) {
      return;
    }

    await Promise.all(
      requests.map(async (request) => {
        return axios.post(`/api/v1/request/${request.id}/${type}`);
      })
    );

    onUpdate();
    mutate('/api/v1/request/count');
  };

  const buttons: ButtonOption[] = [];

  const audiobookBookMode =
    mediaType === 'book' && settings.currentSettings.bookAudiobookEnabled;

  const canRequestBookEbook =
    !media ||
    media.status === MediaStatus.UNKNOWN ||
    (media.status === MediaStatus.DELETED && !activeRequest);

  const canRequestBookAudiobook =
    audiobookBookMode &&
    (!media ||
      media.status4k === MediaStatus.UNKNOWN ||
      (media.status4k === MediaStatus.DELETED && !active4kRequest));

  const canRequestMovieHd =
    mediaType === 'movie' &&
    (!media ||
      media.status === MediaStatus.UNKNOWN ||
      (media.status === MediaStatus.DELETED && !activeRequest)) &&
    hasPermission([Permission.REQUEST, Permission.REQUEST_MOVIE], {
      type: 'or',
    });

  const canRequestMovie4k =
    mediaType === 'movie' &&
    settings.currentSettings.movie4kEnabled &&
    (!media ||
      media.status4k === MediaStatus.UNKNOWN ||
      (media.status4k === MediaStatus.DELETED && !active4kRequest)) &&
    hasPermission([Permission.REQUEST_4K, Permission.REQUEST_4K_MOVIE], {
      type: 'or',
    });

  const canRequestMovie3d =
    mediaType === 'movie' &&
    settings.currentSettings.movie3dEnabled &&
    hasTheatrical3dVersion &&
    (!media ||
      media.status3d === MediaStatus.UNKNOWN ||
      (media.status3d === MediaStatus.DELETED && !active3dRequest)) &&
    hasPermission([Permission.REQUEST, Permission.REQUEST_MOVIE], {
      type: 'or',
    });

  const movieQualityOptions = useMemo((): MovieRequestQuality[] => {
    const options: MovieRequestQuality[] = [];
    if (canRequestMovieHd) {
      options.push('hd');
    }
    if (canRequestMovie4k) {
      options.push('4k');
    }
    if (canRequestMovie3d) {
      options.push('3d');
    }
    return options;
  }, [canRequestMovieHd, canRequestMovie4k, canRequestMovie3d]);

  const startMovieRequest = () => {
    if (movieQualityOptions.length > 1) {
      setShowQualityPicker(true);
      return;
    }
    if (movieQualityOptions.length === 1) {
      openMovieRequest(movieQualityOptions[0]);
    }
  };

  // If there are pending requests, show request management options first
  if (activeRequest || active4kRequest || active3dRequest) {
    if (
      activeRequest &&
      (activeRequest.requestedBy.id === user?.id ||
        (activeRequests?.length === 1 &&
          hasPermission(Permission.MANAGE_REQUESTS)))
    ) {
      buttons.push({
        id: 'active-request',
        text: intl.formatMessage(messages.viewrequest),
        action: () => {
          setEditRequest(true);
          setMovieRequestIs4k(false);
          setMovieRequestIs3d(false);
          setShowRequestModal(true);
        },
        svg: <InformationCircleIcon />,
      });
    }

    if (
      activeRequest &&
      hasPermission(Permission.MANAGE_REQUESTS) &&
      (mediaType === 'movie' || mediaType === 'book')
    ) {
      buttons.push(
        {
          id: 'approve-request',
          text: intl.formatMessage(messages.approverequest),
          action: () => {
            modifyRequest(activeRequest, 'approve');
          },
          svg: <CheckIcon />,
        },
        {
          id: 'decline-request',
          text: intl.formatMessage(messages.declinerequest),
          action: () => {
            modifyRequest(activeRequest, 'decline');
          },
          svg: <XMarkIcon />,
        }
      );
    } else if (
      activeRequests &&
      activeRequests.length > 0 &&
      hasPermission(Permission.MANAGE_REQUESTS) &&
      mediaType === 'tv'
    ) {
      buttons.push(
        {
          id: 'approve-request-batch',
          text: intl.formatMessage(messages.approverequests, {
            requestCount: activeRequests.length,
          }),
          action: () => {
            modifyRequests(activeRequests, 'approve');
          },
          svg: <CheckIcon />,
        },
        {
          id: 'decline-request-batch',
          text: intl.formatMessage(messages.declinerequests, {
            requestCount: activeRequests.length,
          }),
          action: () => {
            modifyRequests(activeRequests, 'decline');
          },
          svg: <XMarkIcon />,
        }
      );
    }

    if (
      active4kRequest &&
      (active4kRequest.requestedBy.id === user?.id ||
        (active4kRequests?.length === 1 &&
          hasPermission(Permission.MANAGE_REQUESTS)))
    ) {
      buttons.push({
        id: 'active-4k-request',
        text: intl.formatMessage(messages.viewrequest4k),
        action: () => {
          setEditRequest(true);
          setMovieRequestIs4k(true);
          setMovieRequestIs3d(false);
          if (mediaType === 'movie') {
            setShowRequestModal(true);
          } else {
            setShowRequest4kModal(true);
          }
        },
        svg: <InformationCircleIcon />,
      });
    }

    if (
      active4kRequest &&
      hasPermission(Permission.MANAGE_REQUESTS) &&
      mediaType === 'movie'
    ) {
      buttons.push(
        {
          id: 'approve-4k-request',
          text: intl.formatMessage(messages.approverequest4k),
          action: () => {
            modifyRequest(active4kRequest, 'approve');
          },
          svg: <CheckIcon />,
        },
        {
          id: 'decline-4k-request',
          text: intl.formatMessage(messages.declinerequest4k),
          action: () => {
            modifyRequest(active4kRequest, 'decline');
          },
          svg: <XMarkIcon />,
        }
      );
    }

    if (
      active3dRequest &&
      (active3dRequest.requestedBy.id === user?.id ||
        (active3dRequests?.length === 1 &&
          hasPermission(Permission.MANAGE_REQUESTS)))
    ) {
      buttons.push({
        id: 'active-3d-request',
        text: intl.formatMessage(messages.viewrequest3d),
        action: () => {
          setEditRequest(true);
          setMovieRequestIs4k(false);
          setMovieRequestIs3d(true);
          setShowRequestModal(true);
        },
        svg: <InformationCircleIcon />,
      });
    }

    if (
      active3dRequest &&
      hasPermission(Permission.MANAGE_REQUESTS) &&
      mediaType === 'movie'
    ) {
      buttons.push(
        {
          id: 'approve-3d-request',
          text: intl.formatMessage(messages.approverequest),
          action: () => {
            modifyRequest(active3dRequest, 'approve');
          },
          svg: <CheckIcon />,
        },
        {
          id: 'decline-3d-request',
          text: intl.formatMessage(messages.declinerequest),
          action: () => {
            modifyRequest(active3dRequest, 'decline');
          },
          svg: <XMarkIcon />,
        }
      );
    } else if (
      active4kRequests &&
      active4kRequests.length > 0 &&
      hasPermission(Permission.MANAGE_REQUESTS) &&
      mediaType === 'tv'
    ) {
      buttons.push(
        {
          id: 'approve-4k-request-batch',
          text: intl.formatMessage(messages.approve4krequests, {
            requestCount: active4kRequests.length,
          }),
          action: () => {
            modifyRequests(active4kRequests, 'approve');
          },
          svg: <CheckIcon />,
        },
        {
          id: 'decline-4k-request-batch',
          text: intl.formatMessage(messages.decline4krequests, {
            requestCount: active4kRequests.length,
          }),
          action: () => {
            modifyRequests(active4kRequests, 'decline');
          },
          svg: <XMarkIcon />,
        }
      );
    }
  }

  // Book: single Request button when ebook + audiobook servers are configured
  if (
    audiobookBookMode &&
    (canRequestBookEbook || canRequestBookAudiobook) &&
    hasPermission(
      [Permission.REQUEST, Permission.REQUEST_BOOK, Permission.REQUEST_4K],
      { type: 'or' }
    )
  ) {
    buttons.push({
      id: 'request-book',
      text: intl.formatMessage(globalMessages.request),
      action: () => {
        setEditRequest(false);
        setShowRequestModal(true);
      },
      svg: <ArrowDownTrayIcon />,
    });
  }

  if (mediaType === 'movie' && movieQualityOptions.length > 0) {
    buttons.push({
      id: 'request-movie',
      text: intl.formatMessage(globalMessages.request),
      action: startMovieRequest,
      svg: <ArrowDownTrayIcon />,
    });
  }

  // Standard ebook request button
  if (
    mediaType !== 'movie' &&
    !audiobookBookMode &&
    canRequestBookEbook &&
    hasPermission(
      [
        Permission.REQUEST,
        mediaType === 'music'
          ? Permission.REQUEST_MUSIC
          : mediaType === 'book'
            ? Permission.REQUEST_BOOK
            : Permission.REQUEST_TV,
      ],
      { type: 'or' }
    )
  ) {
    buttons.push({
      id: 'request',
      text: intl.formatMessage(globalMessages.request),
      action: () => {
        setEditRequest(false);
        setShowRequestModal(true);
      },
      svg: <ArrowDownTrayIcon />,
    });
  } else if (
    mediaType === 'tv' &&
    (!activeRequest || activeRequest.requestedBy.id !== user?.id) &&
    hasPermission([Permission.REQUEST, Permission.REQUEST_TV], {
      type: 'or',
    }) &&
    media &&
    media.status !== MediaStatus.BLOCKLISTED &&
    !isShowComplete
  ) {
    buttons.push({
      id: 'request-more',
      text: intl.formatMessage(messages.requestmore),
      action: () => {
        setEditRequest(false);
        setShowRequestModal(true);
      },
      svg: <ArrowDownTrayIcon />,
    });
  }

  // 4K / audiobook request button (movies use quality picker above)
  if (
    mediaType !== 'movie' &&
    !audiobookBookMode &&
    (!media ||
      media.status4k === MediaStatus.UNKNOWN ||
      (media.status4k === MediaStatus.DELETED && !active4kRequest)) &&
    hasPermission(
      [
        Permission.REQUEST_4K,
        mediaType === 'book'
          ? Permission.REQUEST_BOOK
          : Permission.REQUEST_4K_TV,
      ],
      { type: 'or' }
    ) &&
    ((settings.currentSettings.series4kEnabled && mediaType === 'tv') ||
      (settings.currentSettings.bookAudiobookEnabled && mediaType === 'book'))
  ) {
    buttons.push({
      id: 'request4k',
      text: intl.formatMessage(
        mediaType === 'book'
          ? globalMessages.requestAudiobook
          : globalMessages.request4k
      ),
      action: () => {
        setEditRequest(false);
        setShowRequest4kModal(true);
      },
      svg: <ArrowDownTrayIcon />,
    });
  } else if (
    mediaType === 'tv' &&
    (!active4kRequest || active4kRequest.requestedBy.id !== user?.id) &&
    hasPermission([Permission.REQUEST_4K, Permission.REQUEST_4K_TV], {
      type: 'or',
    }) &&
    media &&
    media.status4k !== MediaStatus.BLOCKLISTED &&
    !is4kShowComplete &&
    settings.currentSettings.series4kEnabled
  ) {
    buttons.push({
      id: 'request-more-4k',
      text: intl.formatMessage(messages.requestmore4k),
      action: () => {
        setEditRequest(false);
        setShowRequest4kModal(true);
      },
      svg: <ArrowDownTrayIcon />,
    });
  }

  const [buttonOne, ...others] = buttons;

  if (!buttonOne) {
    return null;
  }

  return (
    <>
      <Transition
        as="div"
        show={mediaType === 'movie' && showQualityPicker}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        {mediaType === 'movie' && showQualityPicker && (
          <MovieQualityPicker
            options={movieQualityOptions}
            onCancel={() => setShowQualityPicker(false)}
            onSelect={openMovieRequest}
          />
        )}
      </Transition>
      <RequestModal
        key={showRequestModal ? 'book-request-open' : 'book-request-closed'}
        tmdbId={tmdbId}
        mbId={mbId}
        foreignBookId={foreignBookId}
        media={media}
        show={showRequestModal}
        type={mediaType}
        is4k={mediaType === 'movie' ? movieRequestIs4k : undefined}
        is3d={mediaType === 'movie' ? movieRequestIs3d : undefined}
        editRequest={
          editRequest
            ? active3dRequest ?? active4kRequest ?? activeRequest
            : undefined
        }
        onComplete={() => {
          onUpdate();
          setShowRequestModal(false);
        }}
        onCancel={() => setShowRequestModal(false)}
      />
      {mediaType !== 'music' && (
        <RequestModal
          key={
            showRequest4kModal
              ? 'book-request-4k-open'
              : 'book-request-4k-closed'
          }
          tmdbId={tmdbId}
          mbId={mbId}
          foreignBookId={foreignBookId}
          media={media}
          show={showRequest4kModal}
          type={mediaType}
          editRequest={editRequest ? active4kRequest : undefined}
          is4k
          onComplete={() => {
            onUpdate();
            setShowRequest4kModal(false);
          }}
          onCancel={() => setShowRequest4kModal(false)}
        />
      )}
      <ButtonWithDropdown
        text={
          <>
            {buttonOne.svg}
            <span>{buttonOne.text}</span>
          </>
        }
        onClick={buttonOne.action}
        className="ml-2"
      >
        {others && others.length > 0
          ? others.map((button) => (
              <ButtonWithDropdown.Item
                onClick={button.action}
                key={`request-option-${button.id}`}
              >
                {button.svg}
                <span>{button.text}</span>
              </ButtonWithDropdown.Item>
            ))
          : null}
      </ButtonWithDropdown>
    </>
  );
};

export default RequestButton;
