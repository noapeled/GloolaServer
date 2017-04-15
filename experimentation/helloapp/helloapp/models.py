from django.db import models


class Article(models.Model):
    class Meta:
        app_label = 'test'
    title = models.CharField(max_length=64)
    content = models.TextField()
