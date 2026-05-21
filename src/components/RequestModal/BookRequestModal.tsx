import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import Modal from '@app/components/Common/Modal';
import type { RequestOverrides } from '@app/components/RequestModal/AdvancedRequester';
import AdvancedRequester from '@app/components/RequestModal/AdvancedRequester';
import QuotaDisplay from '@app/components/RequestModal/QuotaDisplay';
import useSettings from '@app/hooks/useSettings';
import { useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { MediaRequestStatus, MediaStatus } from '@server/constants/media';
import type Media from '@server/entity/Media';
import type { MediaRequest } from '@server/entity/MediaRequest';
import type { NonFunctionProperties } from '@server/interfaces/api/common';
import type { QuotaResponse } from '@server/interfaces/api/userInterfaces';
import { Permission } from '@server/lib/permissions';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR, { mutate } from 'swr';

const messages = defineMessages('components.RequestModal', {
  requestadmin: 'This request will be approved automatically.',
  requestSuccess: '<strong>{title}</strong> requested successfully!',
  requestBothSuccess:
    '<strong>{title}</strong> requested as ebook and audiobook!',
  requestCancel: 'Request for <strong>{title}</strong> canceled.',
  requestbooktitle: 'Request Book',
  requestaudiobooktitle: 'Request Audiobook',
  chooseFormatTitle: 'Request Format',
  chooseFormat: 'What would you like to request?',
  requestEbookOption: 'Ebook',
  requestAudiobookOption: 'Audiobook',
  requestBothOption: 'Ebook and Audiobook',
  pendingaudiobookrequest: 'Pending Audiobook Request',
  edit: 'Edit Request',
  approve: 'Approve Request',
  cancel: 'Cancel Request',
  pendingrequest: 'Pending Book Request',
  requestfrom: "{username}'s request is pending approval.",
  errorediting: 'Something went wrong while editing the request.',
  requestedited: 'Request for <strong>{title}</strong> edited successfully!',
  requestApproved: 'Request for <strong>{title}</strong> approved!',
  requesterror: 'Something went wrong while submitting the request.',
  pendingapproval: 'Your request is pending approval.',
});

type BookRequestFormat = 'ebook' | 'audiobook' | 'both';

interface BookRequestModalProps extends React.HTMLAttributes<HTMLDivElement> {
  foreignBookId?: string;
  media?: Media;
  is4k?: boolean;
  onCancel?: () => void;
  onComplete?: (newStatus: MediaStatus) => void;
  onUpdating?: (isUpdating: boolean) => void;
  editRequest?: NonFunctionProperties<MediaRequest>;
}

const BookRequestModal = ({
  foreignBookId,
  media,
  is4k = false,
  onCancel,
  onComplete,
  onUpdating,
  editRequest,
}: BookRequestModalProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedFormat, setSelectedFormat] =
    useState<BookRequestFormat | null>(null);
  const [requestOverrides, setRequestOverrides] =
    useState<RequestOverrides | null>(null);
  const { addToast } = useToasts();
  const intl = useIntl();
  const { user, hasPermission } = useUser();
  const settings = useSettings();

  const titleText =
    editRequest?.media?.foreignBookId ?? foreignBookId ?? 'Book';

  const audiobookEnabled = settings.currentSettings.bookAudiobookEnabled;

  const hasPendingEbookRequest = Boolean(
    media?.requests?.some(
      (request) =>
        request.status === MediaRequestStatus.PENDING && !request.is4k
    )
  );
  const hasPendingAudiobookRequest = Boolean(
    media?.requests?.some(
      (request) => request.status === MediaRequestStatus.PENDING && request.is4k
    )
  );

  const canRequestEbook =
    !media ||
    media.status === MediaStatus.UNKNOWN ||
    (media.status === MediaStatus.DELETED && !hasPendingEbookRequest);

  const canRequestAudiobook =
    audiobookEnabled &&
    (!media ||
      media.status4k === MediaStatus.UNKNOWN ||
      (media.status4k === MediaStatus.DELETED && !hasPendingAudiobookRequest));

  const resolvedFormat: BookRequestFormat | null = editRequest
    ? editRequest.is4k
      ? 'audiobook'
      : 'ebook'
    : is4k
      ? 'audiobook'
      : selectedFormat;

  const showFormatChoice =
    !editRequest &&
    audiobookEnabled &&
    canRequestEbook &&
    canRequestAudiobook &&
    selectedFormat === null &&
    !is4k;

  useEffect(() => {
    if (editRequest || is4k || !audiobookEnabled || selectedFormat) {
      return;
    }
    if (canRequestEbook && !canRequestAudiobook) {
      setSelectedFormat('ebook');
    } else if (!canRequestEbook && canRequestAudiobook) {
      setSelectedFormat('audiobook');
    }
  }, [
    editRequest,
    is4k,
    audiobookEnabled,
    canRequestEbook,
    canRequestAudiobook,
    selectedFormat,
  ]);

  const requestIs4k = resolvedFormat === 'audiobook';

  const { data: quota } = useSWR<QuotaResponse>(
    user &&
      (!requestOverrides?.user?.id || hasPermission(Permission.MANAGE_USERS))
      ? `/api/v1/user/${requestOverrides?.user?.id ?? user.id}/quota`
      : null
  );

  useEffect(() => {
    if (onUpdating) {
      onUpdating(isUpdating);
    }
  }, [isUpdating, onUpdating]);

  const sendRequest = useCallback(async () => {
    if (!foreignBookId || !resolvedFormat) {
      return;
    }
    setIsUpdating(true);

    try {
      let overrideParams = {};
      if (requestOverrides) {
        overrideParams = {
          serverId: requestOverrides.server,
          profileId: requestOverrides.profile,
          rootFolder: requestOverrides.folder,
          userId: requestOverrides.user?.id,
          tags: requestOverrides.tags,
        };
      }

      const is4kValues: boolean[] =
        resolvedFormat === 'both' ? [false, true] : [requestIs4k];

      for (const is4kValue of is4kValues) {
        await axios.post<MediaRequest>('/api/v1/request', {
          mediaId: foreignBookId,
          mediaType: 'book',
          is4k: is4kValue,
          ...overrideParams,
        });
      }

      mutate('/api/v1/request?filter=all&take=10&sort=modified&skip=0');
      mutate('/api/v1/request/count');

      if (onComplete) {
        onComplete(
          hasPermission(Permission.AUTO_APPROVE)
            ? MediaStatus.PROCESSING
            : MediaStatus.PENDING
        );
      }
      addToast(
        <span>
          {intl.formatMessage(
            resolvedFormat === 'both'
              ? messages.requestBothSuccess
              : messages.requestSuccess,
            {
              title: titleText,
              strong: (msg: React.ReactNode) => <strong>{msg}</strong>,
            }
          )}
        </span>,
        { appearance: 'success', autoDismiss: true }
      );
    } catch (error) {
      const apiMessage =
        axios.isAxiosError(error) &&
        typeof error.response?.data === 'object' &&
        error.response?.data &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string'
          ? error.response.data.message
          : undefined;

      addToast(apiMessage ?? intl.formatMessage(messages.requesterror), {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      setIsUpdating(false);
    }
  }, [
    foreignBookId,
    onComplete,
    addToast,
    requestOverrides,
    hasPermission,
    intl,
    titleText,
    resolvedFormat,
    requestIs4k,
  ]);

  const cancelRequest = async () => {
    setIsUpdating(true);

    try {
      const response = await axios.delete(`/api/v1/request/${editRequest?.id}`);

      mutate('/api/v1/request?filter=all&take=10&sort=modified&skip=0');
      mutate('/api/v1/request/count');

      if (response.status === 204) {
        if (onComplete) {
          onComplete(MediaStatus.UNKNOWN);
        }
        addToast(
          <span>
            {intl.formatMessage(messages.requestCancel, {
              title: titleText,
              strong: (msg: React.ReactNode) => <strong>{msg}</strong>,
            })}
          </span>,
          { appearance: 'success', autoDismiss: true }
        );
      }
    } catch {
      setIsUpdating(false);
    }
  };

  const updateRequest = async (alsoApproveRequest = false) => {
    setIsUpdating(true);

    try {
      await axios.put(`/api/v1/request/${editRequest?.id}`, {
        mediaType: 'book',
        serverId: requestOverrides?.server,
        profileId: requestOverrides?.profile,
        rootFolder: requestOverrides?.folder,
        userId: requestOverrides?.user?.id,
        tags: requestOverrides?.tags,
      });

      if (alsoApproveRequest) {
        await axios.post(`/api/v1/request/${editRequest?.id}/approve`);
      }

      mutate('/api/v1/request?filter=all&take=10&sort=modified&skip=0');
      mutate('/api/v1/request/count');

      addToast(
        <span>
          {intl.formatMessage(
            alsoApproveRequest
              ? messages.requestApproved
              : messages.requestedited,
            {
              title: titleText,
              strong: (msg: React.ReactNode) => <strong>{msg}</strong>,
            }
          )}
        </span>,
        {
          appearance: 'success',
          autoDismiss: true,
        }
      );

      if (onComplete) {
        onComplete(MediaStatus.PENDING);
      }
    } catch {
      addToast(<span>{intl.formatMessage(messages.errorediting)}</span>, {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (editRequest) {
    const isOwner = editRequest.requestedBy.id === user?.id;

    return (
      <Modal
        loading={false}
        backgroundClickable
        onCancel={onCancel}
        title={intl.formatMessage(messages.pendingrequest)}
        subTitle={titleText}
        backdrop={undefined}
        onOk={() =>
          hasPermission(Permission.MANAGE_REQUESTS)
            ? updateRequest(true)
            : hasPermission(Permission.REQUEST_ADVANCED)
              ? updateRequest()
              : cancelRequest()
        }
        okDisabled={isUpdating}
        okText={
          hasPermission(Permission.MANAGE_REQUESTS)
            ? intl.formatMessage(messages.approve)
            : hasPermission(Permission.REQUEST_ADVANCED)
              ? intl.formatMessage(messages.edit)
              : intl.formatMessage(messages.cancel)
        }
        okButtonType={
          hasPermission(Permission.MANAGE_REQUESTS)
            ? 'success'
            : hasPermission(Permission.REQUEST_ADVANCED)
              ? 'primary'
              : 'danger'
        }
        onSecondary={
          isOwner &&
          hasPermission(
            [Permission.REQUEST_ADVANCED, Permission.MANAGE_REQUESTS],
            { type: 'or' }
          )
            ? () => cancelRequest()
            : undefined
        }
        secondaryDisabled={isUpdating}
        secondaryText={
          isOwner &&
          hasPermission(
            [Permission.REQUEST_ADVANCED, Permission.MANAGE_REQUESTS],
            { type: 'or' }
          )
            ? intl.formatMessage(messages.cancel)
            : undefined
        }
        secondaryButtonType="danger"
        cancelText={intl.formatMessage(globalMessages.close)}
      >
        {isOwner
          ? intl.formatMessage(messages.pendingapproval)
          : intl.formatMessage(messages.requestfrom, {
              username: editRequest.requestedBy.displayName,
            })}
        {(hasPermission(Permission.REQUEST_ADVANCED) ||
          hasPermission(Permission.MANAGE_REQUESTS)) && (
          <AdvancedRequester
            type="book"
            is4k={editRequest.is4k}
            requestUser={editRequest.requestedBy}
            defaultOverrides={{
              folder: editRequest.rootFolder,
              profile: editRequest.profileId,
              server: editRequest.serverId,
              tags: editRequest.tags,
            }}
            onChange={(overrides) => {
              setRequestOverrides(overrides);
            }}
          />
        )}
      </Modal>
    );
  }

  const hasAutoApprove = hasPermission(
    [Permission.MANAGE_REQUESTS, Permission.AUTO_APPROVE],
    { type: 'or' }
  );

  if (!foreignBookId) {
    return (
      <Modal
        loading={false}
        backgroundClickable
        onCancel={onCancel}
        title={intl.formatMessage(
          requestIs4k
            ? messages.requestaudiobooktitle
            : messages.requestbooktitle
        )}
        onOk={onCancel}
        okText={intl.formatMessage(globalMessages.close)}
        okButtonType="primary"
      >
        <p className="text-gray-300">
          Book requests require a valid book identifier. Open this title from
          your library or discovery flow to request it.
        </p>
      </Modal>
    );
  }

  if (showFormatChoice) {
    return (
      <Modal
        loading={false}
        backgroundClickable
        onCancel={onCancel}
        title={intl.formatMessage(messages.chooseFormatTitle)}
        subTitle={titleText}
        cancelText={intl.formatMessage(globalMessages.close)}
      >
        <p className="mb-4">{intl.formatMessage(messages.chooseFormat)}</p>
        <div className="flex flex-col gap-3">
          {canRequestEbook && (
            <Button
              buttonType="primary"
              onClick={() => setSelectedFormat('ebook')}
            >
              {intl.formatMessage(messages.requestEbookOption)}
            </Button>
          )}
          {canRequestAudiobook && (
            <Button
              buttonType="primary"
              onClick={() => setSelectedFormat('audiobook')}
            >
              {intl.formatMessage(messages.requestAudiobookOption)}
            </Button>
          )}
          {canRequestEbook && canRequestAudiobook && (
            <Button
              buttonType="primary"
              onClick={() => setSelectedFormat('both')}
            >
              {intl.formatMessage(messages.requestBothOption)}
            </Button>
          )}
        </div>
      </Modal>
    );
  }

  if (!resolvedFormat) {
    return null;
  }

  return (
    <Modal
      loading={!quota}
      backgroundClickable
      onCancel={onCancel}
      onOk={sendRequest}
      okDisabled={isUpdating || quota?.book?.restricted}
      title={intl.formatMessage(
        resolvedFormat === 'audiobook'
          ? messages.requestaudiobooktitle
          : resolvedFormat === 'both'
            ? messages.chooseFormatTitle
            : messages.requestbooktitle
      )}
      subTitle={titleText}
      okText={
        isUpdating
          ? intl.formatMessage(globalMessages.requesting)
          : intl.formatMessage(globalMessages.request)
      }
      okButtonType="primary"
      cancelText={intl.formatMessage(globalMessages.close)}
      onSecondary={
        audiobookEnabled && canRequestEbook && canRequestAudiobook
          ? () => setSelectedFormat(null)
          : undefined
      }
      secondaryText={
        audiobookEnabled && canRequestEbook && canRequestAudiobook
          ? intl.formatMessage(globalMessages.back)
          : undefined
      }
    >
      {hasAutoApprove && !quota?.book?.restricted && (
        <div className="mt-6">
          <Alert
            title={intl.formatMessage(messages.requestadmin)}
            type="info"
          />
        </div>
      )}
      {(quota?.book?.limit ?? 0) > 0 && (
        <QuotaDisplay
          mediaType="book"
          quota={quota?.book}
          userOverride={
            requestOverrides?.user && requestOverrides.user.id !== user?.id
              ? requestOverrides?.user?.id
              : undefined
          }
        />
      )}
      {resolvedFormat !== 'both' &&
        (hasPermission(Permission.REQUEST_ADVANCED) ||
          hasPermission(Permission.MANAGE_REQUESTS)) && (
          <AdvancedRequester
            type="book"
            is4k={requestIs4k}
            onChange={(overrides) => {
              setRequestOverrides(overrides);
            }}
          />
        )}
    </Modal>
  );
};

export default BookRequestModal;
