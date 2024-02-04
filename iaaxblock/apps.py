from django.apps import AppConfig
from openedx.core.djangoapps.plugins.constants import PluginSettings, ProjectType, SettingsType

class IterativeXBlockAppConfig(AppConfig):
    name = 'iterativexblock'

    plugin_app = {
        PluginSettings.CONFIG: {
            ProjectType.CMS: {
                SettingsType.COMMON: {
                    PluginSettings.RELATIVE_PATH: 'settings.common'},
            },
            ProjectType.LMS: {
                SettingsType.COMMON: {
                    PluginSettings.RELATIVE_PATH: 'settings.common'},
            },
        }}

    def ready(self):
        pass
