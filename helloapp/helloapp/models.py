from djangotoolbox.fields import ListField
from django.db import models


class Post(models.Model):
    class Meta:
        app_label = 'my.test.model'
    title = models.CharField()
    text = models.TextField()
    tags = ListField()
    comments = ListField()
#
#
# if __name__ == '__main__':
#     import os
#     print os.getcwd()
