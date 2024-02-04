from django.db import models


class IterativeXBlockQuestion(models.Model):

    id_course = models.TextField()
    id_question = models.TextField()


class IterativeXBlockAnswer(models.Model):

    question = models.ForeignKey(
        IterativeXBlockQuestion,
        on_delete=models.CASCADE
    )
    id_course = models.TextField()
    id_student = models.TextField()
    answer = models.TextField()
    timestamp = models.DateField()

