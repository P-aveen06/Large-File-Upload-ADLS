from django.urls import path
from .views import StageBlockView, CommitBlockListView

urlpatterns = [
    path('stage/', StageBlockView.as_view(), name='stage-block'),
    path('commit/', CommitBlockListView.as_view(), name='commit-block-list'),
]
