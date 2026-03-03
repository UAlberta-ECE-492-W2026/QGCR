# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.conf.urls import url
from django.views.generic import TemplateView

from panel.views.home_views import HomeView
from panel.views.moves_views import MoveView
from panel.views.config_views import ConfigView
from panel.views.upgrade_views import ChangelogView, UpdatingView

urlpatterns = [

    # Home view
    url(r'^$', HomeView.as_view(), name='home'),

    # Only templates
    url(r'^checkers$', TemplateView.as_view(template_name='checkers-wrapper.html'), name='checkers'),
    url(r'^checkers-game$', TemplateView.as_view(template_name='checkers-game.html'), name='checkers-game'),

    # Upgrade
    url(r'^upgrade$', ChangelogView.as_view(), name='upgrade'),
    url(r'^updating', UpdatingView.as_view(), name='updating'),

    # Settings
    url(r'^settings$', ConfigView.as_view(template_name='settings.html'), name='settings'),

    # REST API
    url(r'^api/talk-move', MoveView.as_view(), name='talk-move'),
]
