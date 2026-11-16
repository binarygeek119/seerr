import SettingsAudiobookshelf from '@app/components/Settings/SettingsAudiobookshelf';
import SettingsLayout from '@app/components/Settings/SettingsLayout';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission } from '@app/hooks/useUser';
import type { NextPage } from 'next';

const SettingsAudiobookshelfPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsAudiobookshelf />
    </SettingsLayout>
  );
};

export default SettingsAudiobookshelfPage;
