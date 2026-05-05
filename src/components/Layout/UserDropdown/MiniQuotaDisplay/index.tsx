import InfinityIcon from '@app/assets/infinity.svg';
import { SmallLoadingSpinner } from '@app/components/Common/LoadingSpinner';
import ProgressCircle from '@app/components/Common/ProgressCircle';
import defineMessages from '@app/utils/defineMessages';
import type { QuotaResponse } from '@server/interfaces/api/userInterfaces';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages(
  'components.Layout.UserDropdown.MiniQuotaDisplay',
  {
    movierequests: 'Movie Requests',
    seriesrequests: 'Series Requests',
    musicrequests: 'Music Requests',
    bookrequests: 'Book Requests',
  }
);

type MiniQuotaDisplayProps = {
  userId: number;
};

const MiniQuotaDisplay = ({ userId }: MiniQuotaDisplayProps) => {
  const intl = useIntl();
  const { data, error } = useSWR<QuotaResponse>(`/api/v1/user/${userId}/quota`);

  if (error) {
    return null;
  }

  if (!data && !error) {
    return <SmallLoadingSpinner />;
  }

  const hasAnyCappedQuota =
    (data?.movie.limit ?? 0) !== 0 ||
    (data?.tv.limit ?? 0) !== 0 ||
    (data?.music.limit ?? 0) !== 0 ||
    (data?.book.limit ?? 0) !== 0;

  const quotaCell = (
    label: string,
    limit: number | undefined,
    remaining: number | undefined
  ) => {
    const lim = limit ?? 0;
    const rem = remaining ?? 0;
    return (
    <div className="flex flex-col space-y-2">
      <div className="text-sm text-gray-200">{label}</div>
      <div className="flex h-full items-center space-x-2 text-gray-200">
        {lim > 0 ? (
          <>
            <ProgressCircle
              className="h-8 w-8"
              progress={Math.round((rem / lim) * 100)}
              useHeatLevel
            />
            <span className="text-lg font-bold">
              {rem} / {lim}
            </span>
          </>
        ) : (
          <>
            <InfinityIcon className="w-7" />
            <span className="font-bold">Unlimited</span>
          </>
        )}
      </div>
    </div>
    );
  };

  return (
    <>
      {hasAnyCappedQuota && (
        <div className="grid w-full max-w-xs grid-cols-2 gap-x-3 gap-y-4">
          {quotaCell(
            intl.formatMessage(messages.movierequests),
            data?.movie.limit,
            data?.movie.remaining
          )}
          {quotaCell(
            intl.formatMessage(messages.seriesrequests),
            data?.tv.limit,
            data?.tv.remaining
          )}
          {quotaCell(
            intl.formatMessage(messages.musicrequests),
            data?.music.limit,
            data?.music.remaining
          )}
          {quotaCell(
            intl.formatMessage(messages.bookrequests),
            data?.book.limit,
            data?.book.remaining
          )}
        </div>
      )}
    </>
  );
};

export default MiniQuotaDisplay;
