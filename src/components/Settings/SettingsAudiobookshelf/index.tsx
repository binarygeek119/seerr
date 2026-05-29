import Alert from '@app/components/Common/Alert';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import LibraryItem from '@app/components/Settings/LibraryItem';
import useSettings from '@app/hooks/useSettings';
import useToasts from '@app/hooks/useToasts';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid';
import type { AudiobookshelfSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Formik } from 'formik';
import Link from 'next/link';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';
import * as Yup from 'yup';

const messages = defineMessages('components.Settings.SettingsAudiobookshelf', {
  title: 'Audiobook Shelf Server',
  description:
    'Connect Audiobookshelf to scan your audiobook library and sync availability with Seerr. Audiobook requests still go to your default audiobook Readarr or Chaptarr server.',
  settings: 'Audiobookshelf Settings',
  settingsDescription:
    'Enter your Audiobookshelf server details. Create an API key in Audiobookshelf under Settings → Users → API Keys.',
  hostname: 'Hostname or IP Address',
  port: 'Port',
  enablessl: 'Use SSL',
  urlBase: 'URL Base',
  apiKey: 'API Key',
  webAppUrl: 'Web App URL',
  libraries: 'Audiobookshelf Libraries',
  librariesDescription:
    'Select which Audiobookshelf libraries Seerr should scan as your audiobook shelf.',
  syncLibraries: 'Sync Libraries',
  syncing: 'Syncing…',
  manualscan: 'Manual Library Scan',
  manualscanDescription:
    'Run a full scan of your enabled Audiobookshelf libraries to update audiobook availability.',
  startscan: 'Start Scan',
  cancelscan: 'Cancel Scan',
  currentlibrary: 'Current Library: {name}',
  librariesRemaining: 'Libraries Remaining: {count}',
  noDefaultAudiobookServer:
    'Configure a default audiobook Readarr or Chaptarr server under Services before audiobook requests can be processed.',
  configureServices: 'Configure audiobook server',
  toastSettingsSuccess: 'Audiobookshelf settings saved successfully!',
  toastSettingsFailure: 'Something went wrong while saving Audiobookshelf settings.',
  toastTestSuccess: 'Audiobookshelf connection established successfully!',
  toastTestFailure: 'Failed to connect to Audiobookshelf.',
  validationHostnameRequired: 'You must provide a valid hostname or IP address',
  validationPortRequired: 'You must provide a valid port number',
  validationApiKeyRequired: 'You must provide an API key',
});

interface Library {
  id: string;
  name: string;
  enabled: boolean;
}

interface SyncStatus {
  running: boolean;
  progress: number;
  total: number;
  currentLibrary?: Library;
  libraries: Library[];
}

const SettingsAudiobookshelf = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const settings = useSettings();
  const [isSyncing, setIsSyncing] = useState(false);

  const { data, error, mutate } = useSWR<AudiobookshelfSettings>(
    '/api/v1/settings/audiobookshelf'
  );
  const { data: libraries, mutate: revalidateLibraries } = useSWR<Library[]>(
    data?.hostname && data?.apiKey ? '/api/v1/settings/audiobookshelf/library' : null
  );
  const { data: syncStatus, mutate: revalidateSync } = useSWR<SyncStatus>(
    '/api/v1/settings/audiobookshelf/sync',
    { refreshInterval: 1000 }
  );

  const activeLibraries = libraries?.filter((library) => library.enabled) ?? [];

  const saveLibraries = async (enabledIds: string[]) => {
    await axios.get('/api/v1/settings/audiobookshelf/library', {
      params: {
        enable: enabledIds.join(','),
      },
    });
    revalidateLibraries();
  };

  const syncLibrariesFromServer = async () => {
    setIsSyncing(true);
    try {
      await axios.get('/api/v1/settings/audiobookshelf/library', {
        params: { sync: true },
      });
      revalidateLibraries();
      mutate();
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleLibrary = async (libraryId: string) => {
    const nextEnabled = activeLibraries.some((library) => library.id === libraryId)
      ? activeLibraries.filter((library) => library.id !== libraryId).map((library) => library.id)
      : [...activeLibraries.map((library) => library.id), libraryId];
    await saveLibraries(nextEnabled);
  };

  const startScan = async () => {
    await axios.post('/api/v1/settings/audiobookshelf/sync', { start: true });
    revalidateSync();
  };

  const cancelScan = async () => {
    await axios.post('/api/v1/settings/audiobookshelf/sync', { cancel: true });
    revalidateSync();
  };

  const validationSchema = Yup.object().shape({
    hostname: Yup.string().required(
      intl.formatMessage(messages.validationHostnameRequired)
    ),
    port: Yup.number()
      .nullable()
      .required(intl.formatMessage(messages.validationPortRequired)),
    apiKey: Yup.string().required(
      intl.formatMessage(messages.validationApiKeyRequired)
    ),
  });

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.title),
          intl.formatMessage(globalMessages.settings),
        ]}
      />
      <p className="description">{intl.formatMessage(messages.description)}</p>
      {!settings.currentSettings.bookAudiobookEnabled && (
        <div className="mt-4">
          <Alert title={intl.formatMessage(messages.noDefaultAudiobookServer)}>
            <Link
              href="/settings/services"
              className="text-indigo-400 transition hover:text-indigo-300 hover:underline"
            >
              {intl.formatMessage(messages.configureServices)}
            </Link>
          </Alert>
        </div>
      )}
      <div className="mb-6 mt-10">
        <h3 className="heading">{intl.formatMessage(messages.settings)}</h3>
        <p className="description">
          {intl.formatMessage(messages.settingsDescription)}
        </p>
      </div>
      <Formik
        enableReinitialize
        initialValues={{
          hostname: data?.hostname ?? '',
          port: data?.port ?? 13378,
          useSsl: data?.useSsl ?? false,
          urlBase: data?.urlBase ?? '',
          apiKey: data?.apiKey ?? '',
          webAppUrl: data?.webAppUrl ?? '',
        }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            await axios.post('/api/v1/settings/audiobookshelf/test', {
              hostname: values.hostname,
              port: Number(values.port),
              useSsl: values.useSsl,
              urlBase: values.urlBase,
              apiKey: values.apiKey,
            });
            await axios.post('/api/v1/settings/audiobookshelf', values);
            addToast(intl.formatMessage(messages.toastSettingsSuccess), {
              appearance: 'success',
              autoDismiss: true,
            });
            mutate();
            revalidateLibraries();
          } catch {
            addToast(intl.formatMessage(messages.toastSettingsFailure), {
              appearance: 'error',
              autoDismiss: true,
            });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ errors, touched, values, handleSubmit, setFieldValue, isSubmitting, isValid }) => (
          <form className="section" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="hostname" className="text-label">
                {intl.formatMessage(messages.hostname)}
              </label>
              <div className="form-input-area">
                <div className="form-input-field">
                  <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-gray-100 sm:text-sm">
                    {values.useSsl ? 'https://' : 'http://'}
                  </span>
                  <Field
                    type="text"
                    id="hostname"
                    name="hostname"
                    className="rounded-r-only"
                  />
                </div>
                {errors.hostname && touched.hostname && (
                  <div className="error">{errors.hostname}</div>
                )}
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="port" className="text-label">
                {intl.formatMessage(messages.port)}
              </label>
              <div className="form-input-area">
                <Field type="text" id="port" name="port" className="short" />
                {errors.port && touched.port && (
                  <div className="error">{errors.port}</div>
                )}
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="useSsl" className="checkbox-label">
                {intl.formatMessage(messages.enablessl)}
              </label>
              <div className="form-input-area">
                <Field
                  type="checkbox"
                  id="useSsl"
                  name="useSsl"
                  onChange={() => setFieldValue('useSsl', !values.useSsl)}
                />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="urlBase" className="text-label">
                {intl.formatMessage(messages.urlBase)}
              </label>
              <div className="form-input-area">
                <Field type="text" id="urlBase" name="urlBase" />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="apiKey" className="text-label">
                {intl.formatMessage(messages.apiKey)}
              </label>
              <div className="form-input-area">
                <SensitiveInput as="field" id="apiKey" name="apiKey" />
                {errors.apiKey && touched.apiKey && (
                  <div className="error">{errors.apiKey}</div>
                )}
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="webAppUrl" className="text-label">
                {intl.formatMessage(messages.webAppUrl)}
              </label>
              <div className="form-input-area">
                <Field type="text" id="webAppUrl" name="webAppUrl" />
              </div>
            </div>
            <div className="actions">
              <Button buttonType="primary" type="submit" disabled={!isValid || isSubmitting}>
                {isSubmitting
                  ? intl.formatMessage(globalMessages.saving)
                  : intl.formatMessage(globalMessages.save)}
              </Button>
            </div>
          </form>
        )}
      </Formik>
      <div className="mb-6 mt-10">
        <h3 className="heading">{intl.formatMessage(messages.libraries)}</h3>
        <p className="description">
          {intl.formatMessage(messages.librariesDescription)}
        </p>
      </div>
      <div className="section">
        <Button
          buttonType="primary"
          onClick={() => syncLibrariesFromServer()}
          disabled={isSyncing || !data?.hostname || !data?.apiKey}
        >
          <span>
            {isSyncing
              ? intl.formatMessage(messages.syncing)
              : intl.formatMessage(messages.syncLibraries)}
          </span>
        </Button>
        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {libraries?.map((library) => (
            <LibraryItem
              key={`abs-library-${library.id}`}
              name={library.name}
              isEnabled={library.enabled}
              onToggle={() => toggleLibrary(library.id)}
            />
          ))}
        </ul>
      </div>
      <div className="mb-6 mt-10">
        <h3 className="heading">{intl.formatMessage(messages.manualscan)}</h3>
        <p className="description">
          {intl.formatMessage(messages.manualscanDescription)}
        </p>
      </div>
      <div className="section">
        <div className="rounded-md bg-gray-800 p-4">
          <div className="relative mb-6 h-8 w-full overflow-hidden rounded-full bg-gray-600">
            {syncStatus?.running && (
              <div
                className="h-8 bg-indigo-600 transition-all duration-200 ease-in-out"
                style={{
                  width: `${Math.round(
                    (syncStatus.progress / Math.max(syncStatus.total, 1)) * 100
                  )}%`,
                }}
              />
            )}
            <div className="absolute inset-0 flex h-8 w-full items-center justify-center text-sm">
              <span>
                {syncStatus?.running
                  ? `${syncStatus.progress} of ${syncStatus.total}`
                  : 'Not running'}
              </span>
            </div>
          </div>
          <div className="flex w-full flex-col sm:flex-row">
            {syncStatus?.running && syncStatus.currentLibrary && (
              <div className="mb-2 flex items-center sm:mb-0 sm:mr-2">
                <Badge>
                  {intl.formatMessage(messages.currentlibrary, {
                    name: syncStatus.currentLibrary.name,
                  })}
                </Badge>
              </div>
            )}
            <div className="flex-1 text-right">
              {!syncStatus?.running ? (
                <Button
                  buttonType="warning"
                  onClick={() => startScan()}
                  disabled={!activeLibraries.length}
                >
                  <MagnifyingGlassIcon />
                  <span>{intl.formatMessage(messages.startscan)}</span>
                </Button>
              ) : (
                <Button buttonType="danger" onClick={() => cancelScan()}>
                  <XMarkIcon />
                  <span>{intl.formatMessage(messages.cancelscan)}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsAudiobookshelf;
