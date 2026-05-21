import Header from '@app/components/Common/Header';
import ListView from '@app/components/Common/ListView';
import PageTitle from '@app/components/Common/PageTitle';
import { prepareFilterValues } from '@app/components/Discover/constants';
import useDiscover from '@app/hooks/useDiscover';
import { useUpdateQueryParams } from '@app/hooks/useUpdateQueryParams';
import Error from '@app/pages/_error';
import defineMessages from '@app/utils/defineMessages';
import { BarsArrowDownIcon } from '@heroicons/react/24/solid';
import type { BookResult } from '@server/models/Search';
import type { AxiosError } from 'axios';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

const messages = defineMessages('components.Discover.DiscoverBooks', {
  discoverbooks: 'Books',
  popularbooksfallback:
    'Showing popular books from Open Library. Add books in Readarr to browse your library here.',
  sortTitleAsc: 'Title (A-Z) Ascending',
  sortTitleDesc: 'Title (Z-A) Descending',
  sortAuthorAsc: 'Author (A-Z) Ascending',
  sortAuthorDesc: 'Author (Z-A) Descending',
  sortMonitoredDesc: 'Monitored First',
  sortHasFileDesc: 'Downloaded First',
});

const SortOptions = {
  TitleAsc: 'title.asc',
  TitleDesc: 'title.desc',
  AuthorAsc: 'author.asc',
  AuthorDesc: 'author.desc',
  MonitoredDesc: 'monitored.desc',
  HasFileDesc: 'hasFile.desc',
} as const;

const DiscoverBooks = () => {
  const intl = useIntl();
  const router = useRouter();
  const updateQueryParams = useUpdateQueryParams({});

  const preparedFilters = prepareFilterValues(router.query);

  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
    firstResultData,
  } = useDiscover<BookResult, { source?: 'library' | 'popular' }>(
    '/api/v1/discover/books',
    preparedFilters,
    {
      hideAvailable: false,
      hideBlocklisted: false,
      initialSize: 1,
    }
  );

  const title = intl.formatMessage(messages.discoverbooks);
  const showingPopularFallback = firstResultData?.source === 'popular';

  if (error) {
    const statusCode = (error as AxiosError)?.response?.status ?? 500;
    return <Error statusCode={statusCode} />;
  }

  return (
    <>
      <PageTitle title={title} />
      <div className="mb-4 flex flex-col justify-between lg:flex-row lg:items-end">
        <div>
          <Header>{title}</Header>
          {showingPopularFallback && (
            <p className="mt-2 text-sm text-gray-400">
              {intl.formatMessage(messages.popularbooksfallback)}
            </p>
          )}
        </div>
        {!showingPopularFallback && (
          <div className="mt-2 flex flex-grow flex-col sm:flex-row lg:flex-grow-0">
            <div className="mb-2 flex flex-grow sm:mb-0 sm:mr-2 lg:flex-grow-0">
              <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-gray-100 sm:text-sm">
                <BarsArrowDownIcon className="h-6 w-6" />
              </span>
              <select
                id="sortBy"
                name="sortBy"
                className="rounded-r-only"
                value={preparedFilters.sortBy ?? SortOptions.TitleAsc}
                onChange={(e) => updateQueryParams('sortBy', e.target.value)}
              >
                <option value={SortOptions.TitleAsc}>
                  {intl.formatMessage(messages.sortTitleAsc)}
                </option>
                <option value={SortOptions.TitleDesc}>
                  {intl.formatMessage(messages.sortTitleDesc)}
                </option>
                <option value={SortOptions.AuthorAsc}>
                  {intl.formatMessage(messages.sortAuthorAsc)}
                </option>
                <option value={SortOptions.AuthorDesc}>
                  {intl.formatMessage(messages.sortAuthorDesc)}
                </option>
                <option value={SortOptions.MonitoredDesc}>
                  {intl.formatMessage(messages.sortMonitoredDesc)}
                </option>
                <option value={SortOptions.HasFileDesc}>
                  {intl.formatMessage(messages.sortHasFileDesc)}
                </option>
              </select>
            </div>
          </div>
        )}
      </div>
      <ListView
        items={titles}
        isEmpty={isEmpty}
        isLoading={
          isLoadingInitialData || (isLoadingMore && (titles?.length ?? 0) > 0)
        }
        isReachingEnd={isReachingEnd}
        onScrollBottom={fetchMore}
      />
    </>
  );
};

export default DiscoverBooks;
