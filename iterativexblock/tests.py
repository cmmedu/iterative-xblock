"""
Module To Test Iterative XBlock
"""
import json
import pytest
from django.test import TransactionTestCase

from mock import MagicMock, Mock

from xblock.field_data import DictFieldData

from .iterativexblock import IterativeAssessedActivityXBlock
from .models import IAAActivity, IAAStage, IAAFeedback, IAASubmission
import json
COURSE_ID = "some_course_id"


class TestRequest(object):
    # pylint: disable=too-few-public-methods
    """
    Module helper for @json_handler
    """
    method = None
    body = None
    success = None


@pytest.mark.django_db
class IAATestCase(TransactionTestCase):
    # pylint: disable=too-many-instance-attributes, too-many-public-methods
    """
    A complete suite of unit tests for the IAA XBlock
    """

    @classmethod
    def make_an_xblock(cls, **kw):
        """
        Helper method that creates an IAA XBlock
        """
        runtime = Mock(
            service=Mock(
                return_value=Mock(_catalog={}),
            ),
        )
        scope_ids = MagicMock()
        field_data = DictFieldData(kw)
        xblock = IterativeAssessedActivityXBlock(runtime, field_data, scope_ids)
        xblock.course_id = COURSE_ID
        return xblock


    def setUp(self):
        """
        Creates some XBlocks
        """
        self.xblock1 = IAATestCase.make_an_xblock()
        self.xblock2 = IAATestCase.make_an_xblock()
        self.xblock3 = IAATestCase.make_an_xblock()
        self.xblock4 = IAATestCase.make_an_xblock()
        self.xblock5 = IAATestCase.make_an_xblock()


    def tearDown(self):
        """
        Cleans the database.
        """
        self.xblock1.iaa_delete()
        self.xblock2.iaa_delete()
        self.xblock3.iaa_delete()
        self.xblock4.iaa_delete()
        self.xblock5.iaa_delete()


    def test_validate_field_data(self):
        """
        Checks if XBlock was created successfully.
        """
        self.assertEqual(self.xblock1.title, "Iterative Assessed Activity")
        self.assertEqual(self.xblock1.block_type, "none")
        self.assertEqual(self.xblock1.activity_name, "")
        self.assertEqual(self.xblock1.activity_stage, "")
        self.assertEqual(self.xblock1.stage_label, "")
        self.assertEqual(self.xblock1.activity_previous, False)
        self.assertEqual(self.xblock1.activity_name_previous, "")
        self.assertEqual(self.xblock1.activity_stage_previous, "")
        self.assertEqual(self.xblock1.display_title, "")
        self.assertEqual(self.xblock1.question, "")
        self.assertEqual(self.xblock1.summary_text, "")

    def test_create_full(self):
        """
        Checks if a 'full' type XBlock was created successfully.
        """
        request = TestRequest()
        request.method = 'POST'
        data = json.dumps({
            "block_type": "full",
            "activity_name": "TestActivity",
            "activity_stage": "1",
            "stage_label": "TestStageLabel1",
            "question": "TestQuestion1",
            "activity_previous": "no",
        })
        request.body = data.encode('utf-8')
        response = self.xblock1.studio_submit(request)
        self.assertEqual(response.json_body["result"], "success")
        self.assertEqual(self.xblock1.block_type, "full")
        self.assertEqual(self.xblock1.activity_name, "TestActivity")
        self.assertEqual(self.xblock1.activity_stage, "1")
        self.assertEqual(self.xblock1.stage_label, "TestStageLabel1")
        self.assertEqual(self.xblock1.question, "TestQuestion1")
        self.assertEqual(self.xblock1.activity_previous, False)
        activity = IAAActivity.objects.get(id_course=COURSE_ID, activity_name=self.xblock1.activity_name)
        self.assertEqual(activity.activity_name, "TestActivity")
        self.assertEqual(activity.id_course, COURSE_ID)
        stage = IAAStage.objects.filter(activity=activity, stage_number=self.xblock1.activity_stage).values("stage_number", "stage_label")
        self.assertEqual(len(stage), 1)
        self.assertEqual(stage[0]["stage_number"], "1")
        self.assertEqual(stage[0]["stage_label"], "TestStageLabel1")
        
    def test_create_display(self):
        """
        Checks if a 'display' type XBlock was created successfully.
        """
        request = TestRequest()
        request.method = 'POST'
        data = json.dumps({
            "block_type": "full",
            "activity_name": "TestActivity",
            "activity_stage": "1",
            "stage_label": "TestStageLabel1",
            "question": "TestQuestion1",
            "activity_previous": "no",
        })
        request.body = data.encode('utf-8')
        response = self.xblock1.studio_submit(request)
        self.assertEqual(response.json_body["result"], "success")
        request2 = TestRequest()
        request2.method = 'POST'
        data2 = json.dumps({
            "block_type": "display",
            "activity_name_previous": "TestActivity",
            "activity_stage_previous": "1",
            "display_title": "TestDisplayTitle"
        })
        request2.body = data2.encode('utf-8')
        response2 = self.xblock2.studio_submit(request2)
        self.assertEqual(response2.json_body["result"], "success")
        self.assertEqual(self.xblock2.block_type, "display")
        self.assertEqual(self.xblock2.activity_name_previous, "TestActivity")
        self.assertEqual(self.xblock2.activity_stage_previous, "1")
        self.assertEqual(self.xblock2.display_title, "TestDisplayTitle")

    def test_create_summary(self):
        """
        Checks if a 'summary' type XBlock was created successfully.
        """
        request = TestRequest()
        request.method = 'POST'
        data = json.dumps({
            "block_type": "full",
            "activity_name": "TestActivity",
            "activity_stage": "1",
            "stage_label": "TestStageLabel1",
            "question": "TestQuestion1",
            "activity_previous": "no",
        })
        request.body = data.encode('utf-8')
        response = self.xblock1.studio_submit(request)
        self.assertEqual(response.json_body["result"], "success")
        request2 = TestRequest()
        request2.method = 'POST'
        data2 = json.dumps({
            "block_type": "summary",
            "activity_name": "TestActivity",
            "summary_text": "TestSummaryText",
            "summary_list": "1"
        })
        request2.body = data2.encode('utf-8')
        response2 = self.xblock2.studio_submit(request2)
        self.assertEqual(response2.json_body["result"], "success")
        self.assertEqual(self.xblock2.block_type, "summary")
        self.assertEqual(self.xblock2.activity_name, "TestActivity")
        self.assertEqual(self.xblock2.summary_text, "TestSummaryText")
        self.assertEqual(self.xblock2.summary_list, "1")

    def test_create_full_with_display(self):
        """
        Checks if a 'full' type XBlock, with a previous displayed answer, was created successfully.
        """
        request = TestRequest()
        request.method = 'POST'
        data = json.dumps({
            "block_type": "full",
            "activity_name": "TestActivity",
            "activity_stage": "1",
            "stage_label": "TestStageLabel1",
            "question": "TestQuestion1",
            "activity_previous": "no",
        })
        request.body = data.encode('utf-8')
        response = self.xblock1.studio_submit(request)
        self.assertEqual(response.json_body["result"], "success")
        request2 = TestRequest()
        request2.method = 'POST'
        data2 = json.dumps({
            "block_type": "full",
            "activity_name": "TestActivity",
            "activity_stage": "2",
            "stage_label": "TestStageLabel2",
            "question": "TestQuestion2",
            "activity_previous": "yes",
            "activity_name_previous": "TestActivity",
            "activity_stage_previous": "1",
            "display_title": "TestDisplayTitle"
        })
        request2.body = data2.encode('utf-8')
        response2 = self.xblock2.studio_submit(request2)
        self.assertEqual(response2.json_body["result"], "success")
        self.assertEqual(self.xblock2.block_type, "full")
        self.assertEqual(self.xblock2.activity_name_previous, "TestActivity")
        self.assertEqual(self.xblock2.activity_stage_previous, "1")
        self.assertEqual(self.xblock2.display_title, "TestDisplayTitle")

    def test_studentAnswer(self):
        '''
            preparar el bloque
        '''
        request = TestRequest()
        request.method = 'POST'
        data = json.dumps({
            "block_type": "full",
            "activity_name": "TestActivity",
            "activity_stage": "1",
            "stage_label": "TestStageLabel1",
            "question": "TestQuestion1",
            "activity_previous": "no",
        })
        request.body = data.encode('utf-8')
        response = self.xblock4.studio_submit(request)
        self.assertEqual(response.json_body["result"], "success")
        self.assertEqual(self.xblock4.block_type, "full")
        self.assertEqual(self.xblock4.activity_name, "TestActivity")
        self.assertEqual(self.xblock4.activity_stage, "1")
        self.assertEqual(self.xblock4.stage_label, "TestStageLabel1")
        self.assertEqual(self.xblock4.question, "TestQuestion1")
        self.assertEqual(self.xblock4.activity_previous, False)
        activity = IAAActivity.objects.get(id_course=COURSE_ID, activity_name=self.xblock4.activity_name)
        self.assertEqual(activity.activity_name, "TestActivity")
        self.assertEqual(activity.id_course, COURSE_ID)
        stage = IAAStage.objects.filter(activity=activity, stage_number=self.xblock4.activity_stage).values("stage_number", "stage_label")
        self.assertEqual(len(stage), 1)
        self.assertEqual(stage[0]["stage_number"], "1")
        self.assertEqual(stage[0]["stage_label"], "TestStageLabel1")

        self.xblock4.studio_submit(request)

        '''
           Preparar respuesta
        '''

        answer = TestRequest()
        dataanswer = json.dumps({
            "submission" : "Respondere esperando feedback"
        })
        answer.body = dataanswer.encode('utf-8')

        self.xblock4.student_submit(answer)

    def test_teacherFeedback(self):
        '''
            preparar feedback
        '''
        feedback = TestRequest()
        datafeedback = json.dumps({
            "submission" : "Y este es el feedback"
        })
        feedback.body = datafeedback.encode('utf-8')

        self.xblock4.instructor_submit(feedback)

    def test_duplicate(self):
        #Duplicar el Xblock
        self.assertEqual(IAAActivity.objects.all().count(), 0)
        activity = IAAActivity.objects.create(id_course=COURSE_ID, activity_name='TestActivity')
        stage = IAAStage.objects.create(activity=activity, stage_label='TestStageLabel1', stage_number='1')
        fake_xblock =  Mock(
            stage_number = stage.stage_number,
            activity_name = activity.activity_name,
            block_type = 'full'
        )
        duplicated = self.xblock5.studio_post_duplicate("", fake_xblock)
        self.assertEqual(duplicated, True)
        item = IAAActivity.objects.last()
        random = item.id + 1
        activity_name = 'TestActivity_copy{}'.format(random)
        self.assertTrue(IAAActivity.objects.filter(activity_name=activity_name).exists())



    def test_studentAnswerFeedbackStage2(self):
        '''
            preparar el bloque
        '''
        request = TestRequest()
        request.method = 'POST'
        data = json.dumps({
            "block_type": "full",
            "activity_name": "TestActivity",
            "activity_stage": "2",
            "stage_label": "TestStageLabel2",
            "question": "TestQuestion2",
            "activity_previous": "yes",
            "activity_stage_previous": "1",
        })
        request.body = data.encode('utf-8')
        response = self.xblock5.studio_submit(request)
        self.assertEqual(response.json_body["result"], "success")
        self.assertEqual(self.xblock5.block_type, "full")
        self.assertEqual(self.xblock5.activity_name, "TestActivity")
        self.assertEqual(self.xblock5.activity_stage, "2")
        self.assertEqual(self.xblock5.stage_label, "TestStageLabel2")
        self.assertEqual(self.xblock5.question, "TestQuestion2")
        self.assertEqual(self.xblock5.activity_previous, True)
        self.assertEqual(self.xblock5.activity_stage_previous, "1")
        activity = IAAActivity.objects.get(id_course=COURSE_ID, activity_name=self.xblock5.activity_name)
        self.assertEqual(activity.activity_name, "TestActivity")
        self.assertEqual(activity.id_course, COURSE_ID)
        stage = IAAStage.objects.filter(activity=activity, stage_number=self.xblock4.activity_stage).values("stage_number", "stage_label")
        self.assertEqual(len(stage), 0)

        self.xblock5.studio_submit(request)

        '''
           Preparar respuesta
        '''

        answer = TestRequest()
        dataanswer = json.dumps({
            "submission" : "Respondere otra vez esperando feedback"
        })
        answer.body = dataanswer.encode('utf-8')

        self.xblock5.student_submit(answer)

        '''
            preparar feedback
        '''

        feedback = TestRequest()
        datafeedback = json.dumps({
            "submission" : "y este es el segundo feedback"
        })
        feedback.body = datafeedback.encode('utf-8')
        self.xblock5.instructor_submit(feedback)
    

    def test_edit_full (self):
        request = TestRequest()
        request.method = 'POST'
        data = json.dumps({
            "block_type": "full",
            "activity_name": "TestActivity",
            "activity_stage": "1",
            "stage_label": "TestStageLabel1",
            "question": "TestQuestion1",
            "activity_previous": "no",
        })
        request.body = data.encode('utf-8')
        response = self.xblock1.studio_submit(request)
        self.assertEqual(response.json_body["result"], "success")
        request2 = TestRequest()
        request2.method = 'POST'
        data2 = json.dumps({
            "block_type": "full",
            "activity_name": "TestActivity",
            "activity_stage": "2",
            "stage_label": "TestStageLabel2",
            "question": "TestQuestion2",
            "activity_previous": "yes",
            "activity_name_previous": "TestActivity",
            "activity_stage_previous": "1",
            "display_title": "TestDisplayTitle"
        })
        request2.body = data2.encode('utf-8')
        response2 = self.xblock2.studio_submit(request2)
        self.assertEqual(response2.json_body["result"], "success")
        request3 = TestRequest()
        request3.method = 'POST'
        data3 = json.dumps({
            "block_type": "full",
            "activity_name": "TestActivity",
            "activity_stage": "2",
            "stage_label": "TestStageLabel2",
            "question": "TestQuestion2",
            "activity_previous": "no",
            "display_title": "TestDisplayTitle"
        })
        request3.body = data3.encode('utf-8')
        response3 = self.xblock2.studio_submit(request3)
        self.assertEqual(response3.json_body["result"], "success")


    def test_edit_display(self):
        request = TestRequest()
        request.method = 'POST'
        data = json.dumps({
            "block_type": "full",
            "activity_name": "TestActivity",
            "activity_stage": "1",
            "stage_label": "TestStageLabel1",
            "question": "TestQuestion1",
            "activity_previous": "no",
        })
        request.body = data.encode('utf-8')
        response = self.xblock1.studio_submit(request)
        self.assertEqual(response.json_body["result"], "success")
        request2 = TestRequest()
        request2.method = 'POST'
        data2 = json.dumps({
            "block_type": "display",
            "activity_name_previous": "TestActivity",
            "activity_stage_previous": "1",
            "display_title": "TestDisplayTitle"
        })
        request2.body = data2.encode('utf-8')
        response2 = self.xblock2.studio_submit(request2)
        self.assertEqual(response2.json_body["result"], "success")
        request3 = TestRequest()
        request3.method = 'POST'
        data3 = json.dumps({
            "block_type": "display",
            "activity_name_previous": "TestActivity",
            "activity_stage_previous": "1",
            "display_title": "AnotherDisplayTitle"
        })
        request3.body = data3.encode('utf-8')
        response3 = self.xblock2.studio_submit(request3)
        self.assertEqual(response3.json_body["result"], "success")
        self.assertEqual(self.xblock2.block_type, "display")
        self.assertEqual(self.xblock2.activity_name_previous, "TestActivity")
        self.assertEqual(self.xblock2.activity_stage_previous, "1")
        self.assertEqual(self.xblock2.display_title, "AnotherDisplayTitle")


    def test_edit_summary(self):
        request = TestRequest()
        request.method = 'POST'
        data = json.dumps({
            "block_type": "full",
            "activity_name": "TestActivity",
            "activity_stage": "1",
            "stage_label": "TestStageLabel1",
            "question": "TestQuestion1",
            "activity_previous": "no",
        })
        request.body = data.encode('utf-8')
        response = self.xblock1.studio_submit(request)
        self.assertEqual(response.json_body["result"], "success")
        request2 = TestRequest()
        request2.method = 'POST'
        data2 = json.dumps({
            "block_type": "summary",
            "activity_name": "TestActivity",
            "summary_text": "TestSummaryText",
            "summary_list": "1"
        })
        request2.body = data2.encode('utf-8')
        response2 = self.xblock2.studio_submit(request2)
        self.assertEqual(response2.json_body["result"], "success")
        request3 = TestRequest()
        request3.method = 'POST'
        data3 = json.dumps({
            "block_type": "summary",
            "activity_name": "TestActivity",
            "summary_text": "TestSummaryTextEdited",
            "summary_list": "1"
        })
        request3.body = data3.encode('utf-8')
        response3 = self.xblock2.studio_submit(request3)
        self.assertEqual(response3.json_body["result"], "success")
        self.assertEqual(self.xblock2.block_type, "summary")
        self.assertEqual(self.xblock2.activity_name, "TestActivity")
        self.assertEqual(self.xblock2.summary_text, "TestSummaryTextEdited")
        self.assertEqual(self.xblock2.summary_list, "1")
        
    def test_submit_full_submission(self):
        # Responder el blouqe
        pass

    def test_submit_full_feedback(self):
        # Dar feedback desde el instructor.
        activity = IAAActivity.objects.create(id_course=COURSE_ID, activity_name='TestActivity')
        stage = IAAStage.objects.create(activity=activity, stage_label='TestStageLabel1', stage_number='1')
        request = TestRequest()
        request.method = 'POST'
        data = json.dumps({
            "id_student": "1",
            "feedback":"this is a feedback"
        })
        request.body = data.encode('utf-8')
        self.xblock1.activity_name = activity.activity_name
        self.xblock1.stage_number = stage.stage_number
        self.xblock1.scope_ids.user_id = 101 #instructor id
        self.assertEqual(IAAFeedback.objects.all().count(), 0)
        response = self.xblock1.instructor_submit(request)
        data_response = json.loads(response._app_iter[0].decode())
        self.assertEqual(data_response['result'], 'success')
        self.assertEqual(IAAFeedback.objects.all().count(), 1)
        feedback = IAAFeedback.objects.first()
        self.assertEqual(feedback.stage, stage)
        self.assertEqual(feedback.id_student, '1')
        self.assertEqual(feedback.id_instructor, '101')
        self.assertEqual(feedback.feedback, 'this is a feedback')
        #new feedback
        data = json.dumps({
            "id_student": "1",
            "feedback":"this is a new feedback"
        })
        request.body = data.encode('utf-8')
        response = self.xblock1.instructor_submit(request)
        data_response = json.loads(response._app_iter[0].decode())
        self.assertEqual(data_response['result'], 'success')
        self.assertEqual(IAAFeedback.objects.all().count(), 1)
        feedback = IAAFeedback.objects.first()
        self.assertEqual(feedback.stage, stage)
        self.assertEqual(feedback.id_student, '1')
        self.assertEqual(feedback.id_instructor, '101')
        self.assertEqual(feedback.feedback, 'this is a new feedback')

    def test_make_submission(self):
        """
        Checks if a submission is sent correctly.
        """
        request = TestRequest()
        request.method = 'POST'
        data = json.dumps({
            "block_type": "full",
            "activity_name": "TestActivity",
            "activity_stage": "1",
            "stage_label": "TestStageLabel1",
            "question": "TestQuestion1",
            "activity_previous": "no",
        })
        request.body = data.encode('utf-8')
        self.xblock1.scope_ids.user_id = 99
        response = self.xblock1.studio_submit(request)
        self.assertEqual(response.json_body["result"], "success")
        request2 = TestRequest()
        request2.method = 'POST'
        data2 = json.dumps({
            "submission": "TestSubmission"
        })
        request2.body = data2.encode('utf-8')
        response2 = self.xblock1.student_submit(request2)
        self.assertEqual(response2.json_body["result"], "success")
        activity = IAAActivity.objects.get(id_course=COURSE_ID, activity_name=self.xblock1.activity_name)
        stage = IAAStage.objects.get(activity=activity, stage_number=self.xblock1.activity_stage)
        submissions = IAASubmission.objects.filter(stage=stage).values("submission")
        self.assertEqual(len(submissions), 1)
        self.assertEqual(submissions[0]["submission"], "TestSubmission")
