from django.test import TransactionTestCase
import json
from mock import MagicMock, Mock
import pytest
from xblock.field_data import DictFieldData

from .iterativexblock import IterativeXBlock
from .models import IterativeXBlockQuestion, IterativeXBlockAnswer

COURSE_ID = "some_course_id"


class TestRequest(object):
    """
    Module helper for @json_handler.
    """
    method = None
    body = None
    success = None


@pytest.mark.django_db
class IterativeXBlockTestCase(TransactionTestCase):
    """
    A complete suite of unit tests for the Iterative XBlock.
    """

    @classmethod
    def make_an_xblock(cls, id, **kw):
        """
        Helper method that creates an Iterative XBlock.
        """
        runtime = Mock(
            service=Mock(
                return_value=Mock(_catalog={}),
            ),
        )
        scope_ids = MagicMock()
        field_data = DictFieldData(kw)
        xblock = IterativeXBlock(runtime, field_data, scope_ids)
        xblock.course_id = COURSE_ID
        xblock.location = "block-v1:edX+DemoX+Demo_Course+type@sequential+block@{}".format(id)
        return xblock


    def setUp(self):
        """
        Creates some XBlocks.
        """
        self.xblock1 = IterativeXBlockTestCase.make_an_xblock(1)
        self.xblock2 = IterativeXBlockTestCase.make_an_xblock(2)
        self.xblock3 = IterativeXBlockTestCase.make_an_xblock(3)
        self.xblock4 = IterativeXBlockTestCase.make_an_xblock(4)
        self.xblock5 = IterativeXBlockTestCase.make_an_xblock(5)
        self.xblock6 = IterativeXBlockTestCase.make_an_xblock(6)
        self.xblock7 = IterativeXBlockTestCase.make_an_xblock(7)
        self.xblock8 = IterativeXBlockTestCase.make_an_xblock(8)
        self.xblock9 = IterativeXBlockTestCase.make_an_xblock(9)


    def tearDown(self):
        """
        Cleans the database.
        """
        self.xblock1.destroy_questions()
        self.xblock2.destroy_questions()
        self.xblock3.destroy_questions()
        self.xblock4.destroy_questions()
        self.xblock5.destroy_questions()


    def test_validate_field_data(self):
        """
        Checks if XBlock was created successfully.
        """
        self.assertEqual(self.xblock1.title, "Iterative XBlock")
        self.assertEqual(self.xblock1.style, "basic")
        self.assertEqual(self.xblock1.configured, False)
        self.assertEqual(self.xblock1.gridlines, False)
        self.assertEqual(self.xblock1.no_answer_message, "You have not answered this question yet.")
        self.assertEqual(self.xblock1.submit_message, "Submit")
        self.assertEqual(self.xblock1.submitted_message, "Done")
        self.assertEqual(self.xblock1.display_message, "Display")
        self.assertEqual(self.xblock1.min_questions, 0)
        self.assertEqual(self.xblock1.enable_download, False)
        self.assertEqual(self.xblock1.content, {
            "n_rows": 1,
            "1": {
                "n_cells": 2,
                "1": {
                    "type": "none",
                    "content": ""
                },
                "2": {
                    "type": "none",
                    "content": ""
                }
            }
        })


    def test_configure_text(self):
        """
        Checks if an XBlock gets configured successfully. Only text content is used.
        """
        request = TestRequest()
        request.method = 'POST'
        sample_content = {
            "n_rows": 2,
            "1": {
                "n_cells": 2,
                "1": {
                    "type": "text",
                    "content": "TestText1"
                },
                "2": {
                    "type": "text",
                    "content": "TestText2"
                }
            },
            "2": {
                "n_cells": 3,
                "1": {
                    "type": "text",
                    "content": "TestText3"
                },
                "2": {
                    "type": "text",
                    "content": "TestText4"
                },
                "3": {
                    "type": "text",
                    "content": "TestText5"
                }
            }
        }
        data = json.dumps({
            "content": sample_content,
            "title": self.xblock1.title,
            "style": self.xblock1.style,
            "gridlines": self.xblock1.gridlines,
            "no_answer_message": self.xblock1.no_answer_message,
            "submit_message": self.xblock1.submit_message,
            "submitted_message": self.xblock1.submitted_message,
            "display_message": self.xblock1.display_message,
            "min_questions": self.xblock1.min_questions,
            "enable_download": self.xblock1.enable_download,
            "new_questions": [],
            "removed_questions": []
        })
        request.body = data.encode('utf-8')
        response = self.xblock1.studio_submit(request)
        self.assertEqual(response.json_body["result"], "success")
        self.assertEqual(self.xblock1.content, sample_content)


    def test_configure_question(self):
        """
        Checks if an XBlock gets configured successfully. Only text and questions content is used.
        """
        request = TestRequest()
        request.method = 'POST'
        sample_content = {
            "n_rows": 2,
            "1": {
                "n_cells": 2,
                "1": {
                    "type": "question",
                    "content": "q001"
                },
                "2": {
                    "type": "text",
                    "content": "TestText2"
                }
            },
            "2": {
                "n_cells": 3,
                "1": {
                    "type": "text",
                    "content": "TestText3"
                },
                "2": {
                    "type": "question",
                    "content": "q002"
                },
                "3": {
                    "type": "question",
                    "content": "q003"
                }
            }
        }
        data = json.dumps({
            "content": sample_content,
            "title": self.xblock2.title,
            "style": self.xblock2.style,
            "gridlines": self.xblock2.gridlines,
            "no_answer_message": self.xblock2.no_answer_message,
            "submit_message": self.xblock2.submit_message,
            "submitted_message": self.xblock2.submitted_message,
            "display_message": self.xblock2.display_message,
            "min_questions": self.xblock2.min_questions,
            "enable_download": self.xblock2.enable_download,
            "new_questions": ["q001", "q002", "q003"],
            "removed_questions": []
        })
        request.body = data.encode('utf-8')
        response = self.xblock2.studio_submit(request)
        id_xblock = str(self.xblock2.location).split('@')[-1]
        self.assertEqual(response.json_body["result"], "success")
        self.assertEqual(self.xblock2.content, sample_content)   
        self.assertEqual(IterativeXBlockQuestion.objects.filter(id_course=COURSE_ID, id_xblock=id_xblock).count(), 3)
        i = 1
        for question in IterativeXBlockQuestion.objects.filter(id_course=COURSE_ID, id_xblock=id_xblock):
            self.assertEqual(question.id_question, 'q00{}'.format(i))
            self.assertEqual(question.id_course, COURSE_ID)
            self.assertEqual(question.id_xblock, id_xblock)
            self.assertEqual(IterativeXBlockAnswer.objects.filter(question=question, id_course=COURSE_ID).count(), 0)
            i += 1


    def test_configure_all(self):
        """
        Checks if an XBlock gets configured successfully. All content is used.
        """
        request = TestRequest()
        request.method = 'POST'
        sample_content = {
            "n_rows": 3,
            "1": {
                "n_cells": 2,
                "1": {
                    "type": "question",
                    "content": "q004"
                },
                "2": {
                    "type": "text",
                    "content": "TestText2"
                }
            },
            "2": {
                "n_cells": 3,
                "1": {
                    "type": "text",
                    "content": "TestText3"
                },
                "2": {
                    "type": "text",
                    "content": "TestText4"
                },
                "3": {
                    "type": "question",
                    "content": "q005"
                }
            },
            "3": {
                "n_cells": 3,
                "1": {
                    "type": "answer",
                    "content": "q001"
                },
                "2": {
                    "type": "answer",
                    "content": "q002"
                },
                "3": {
                    "type": "answer",
                    "content": "q003"
                }
            }
        }
        data = json.dumps({
            "content": sample_content,
            "title": self.xblock3.title,
            "style": self.xblock3.style,
            "gridlines": self.xblock3.gridlines,
            "no_answer_message": self.xblock3.no_answer_message,
            "submit_message": self.xblock3.submit_message,
            "submitted_message": self.xblock3.submitted_message,
            "display_message": self.xblock3.display_message,
            "min_questions": self.xblock3.min_questions,
            "enable_download": self.xblock3.enable_download,
            "new_questions": ["q004", "q005"],
            "removed_questions": []
        })
        request.body = data.encode('utf-8')
        response = self.xblock3.studio_submit(request)
        id_xblock = str(self.xblock3.location).split('@')[-1]
        self.assertEqual(response.json_body["result"], "success")
        self.assertEqual(self.xblock3.content, sample_content)
        self.assertEqual(IterativeXBlockQuestion.objects.filter(id_course=COURSE_ID, id_xblock=id_xblock).count(), 2)
        i = 4
        for question in IterativeXBlockQuestion.objects.filter(id_course=COURSE_ID, id_xblock=id_xblock):
            self.assertEqual(question.id_question, 'q00{}'.format(i))
            self.assertEqual(question.id_course, COURSE_ID)
            self.assertEqual(question.id_xblock, id_xblock)
            self.assertEqual(IterativeXBlockAnswer.objects.filter(question=question, id_course=COURSE_ID).count(), 0)
            i += 1

    
    def test_configure_edit(self):
        """
        Checks if an XBlock gets configured successfully. All content is used. Then, the XBlock is edited.
        """
        request = TestRequest()
        request.method = 'POST'
        sample_content = {
            "n_rows": 1,
            "1": {
                "n_cells": 4,
                "1": {
                    "type": "question",
                    "content": "q006"
                },
                "2": {
                    "type": "text",
                    "content": "TestText2"
                },
                "3": {
                    "type": "answer",
                    "content": "q001"
                },
                "4": {
                    "type": "question",
                    "content": "q007"
                }
            }
        }
        data = json.dumps({
            "content": sample_content,
            "title": "Some other title",
            "style": "style2",
            "gridlines": True,
            "no_answer_message": "Custom no answer message",
            "submit_message": "Custom submit message",
            "submitted_message": "Custom submitted message",
            "display_message": "Custom display message",
            "min_questions": 1,
            "enable_download": self.xblock4.enable_download,
            "new_questions": ["q006", "q007"],
            "removed_questions": []
        })
        request.body = data.encode('utf-8')
        response = self.xblock4.studio_submit(request)
        id_xblock = str(self.xblock4.location).split('@')[-1]
        self.assertEqual(response.json_body["result"], "success")
        self.assertEqual(self.xblock4.title, "Some other title")
        self.assertEqual(self.xblock4.style, "style2")
        self.assertEqual(self.xblock4.gridlines, True)
        self.assertEqual(self.xblock4.no_answer_message, "Custom no answer message")
        self.assertEqual(self.xblock4.submit_message, "Custom submit message")
        self.assertEqual(self.xblock4.submitted_message, "Custom submitted message")
        self.assertEqual(self.xblock4.display_message, "Custom display message")
        self.assertEqual(self.xblock4.min_questions, 1)
        self.assertEqual(self.xblock4.enable_download, False)
        self.assertEqual(self.xblock4.content, sample_content)
        self.assertEqual(IterativeXBlockQuestion.objects.filter(id_course=COURSE_ID, id_xblock=id_xblock).count(), 2)
        i = 6
        for question in IterativeXBlockQuestion.objects.filter(id_course=COURSE_ID, id_xblock=id_xblock):
            self.assertEqual(question.id_question, 'q00{}'.format(i))
            self.assertEqual(question.id_course, COURSE_ID)
            self.assertEqual(question.id_xblock, id_xblock)
            self.assertEqual(IterativeXBlockAnswer.objects.filter(question=question, id_course=COURSE_ID).count(), 0)
            i += 1
        self.assertEqual(IterativeXBlockAnswer.objects.filter(question=question, id_course=COURSE_ID).count(), 0)
        request2 = TestRequest()
        request2.method = 'POST'
        sample_content2 = {
            "n_rows": 2,
            "1": {
                "n_cells": 3,
                "1": {
                    "type": "question",
                    "content": "q006"
                },
                "2": {
                    "type": "text",
                    "content": "TestText2"
                },
                "3": {
                    "type": "answer",
                    "content": "q001"
                }
            },
            "2": {
                "n_cells": 2,
                "1": {
                    "type": "question",
                    "content": "q008"
                },
                "2": {
                    "type": "text",
                    "content": "TestText4"
                }
            }
        }
        data2 = json.dumps({
            "content": sample_content2,
            "title": self.xblock4.title,
            "style": self.xblock4.style,
            "gridlines": self.xblock4.gridlines,
            "no_answer_message": self.xblock4.no_answer_message,
            "submit_message": self.xblock4.submit_message,
            "submitted_message": self.xblock4.submitted_message,
            "display_message": self.xblock4.display_message,
            "min_questions": self.xblock4.min_questions,
            "enable_download": self.xblock4.enable_download,
            "new_questions": ["q008"],
            "removed_questions": ["q007"]
        })
        request2.body = data2.encode('utf-8')
        response2 = self.xblock4.studio_submit(request2)
        self.assertEqual(response2.json_body["result"], "success")
        self.assertEqual(self.xblock4.content, sample_content2)
        self.assertEqual(IterativeXBlockQuestion.objects.filter(id_course=COURSE_ID, id_xblock=id_xblock).count(), 2)
        i = 6
        for question in IterativeXBlockQuestion.objects.filter(id_course=COURSE_ID, id_xblock=id_xblock):
            self.assertEqual(question.id_question, 'q00{}'.format(i))
            self.assertEqual(question.id_course, COURSE_ID)
            self.assertEqual(question.id_xblock, id_xblock)
            self.assertEqual(IterativeXBlockAnswer.objects.filter(question=question, id_course=COURSE_ID).count(), 0)
            i += 2
        self.assertEqual(IterativeXBlockQuestion.objects.filter(id_question="q007", id_course=COURSE_ID, id_xblock=id_xblock).count(), 0)


    def test_student_answer(self):
        """
        Checks if a student's answer is saved successfully.
        """
        request = TestRequest()
        request.method = 'POST'
        sample_content = {
            "n_rows": 2,
            "1": {
                "n_cells": 2,
                "1": {
                    "type": "question",
                    "content": "q009"
                },
                "2": {
                    "type": "text",
                    "content": "TestText2"
                }
            },
            "2": {
                "n_cells": 3,
                "1": {
                    "type": "text",
                    "content": "TestText3"
                },
                "2": {
                    "type": "question",
                    "content": "q010"
                },
                "3": {
                    "type": "question",
                    "content": "q011"
                }
            }
        }
        data = json.dumps({
            "content": sample_content,
            "title": self.xblock5.title,
            "style": self.xblock5.style,
            "gridlines": self.xblock5.gridlines,
            "no_answer_message": self.xblock5.no_answer_message,
            "submit_message": self.xblock5.submit_message,
            "submitted_message": self.xblock5.submitted_message,
            "display_message": self.xblock5.display_message,
            "min_questions": self.xblock5.min_questions,
            "enable_download": self.xblock5.enable_download,
            "new_questions": ["q009", "q010", "q011"],
            "removed_questions": []
        })
        request.body = data.encode('utf-8')
        response = self.xblock5.studio_submit(request)
        self.assertEqual(response.json_body["result"], "success")
        answer = TestRequest()
        answer.method = 'POST'
        dataanswer = json.dumps({
            "q009": "First response",
            "q010": "Second response",
            "q011": "Third response"
        })
        answer.body = dataanswer.encode('utf-8')
        self.xblock5.scope_ids.user_id = "101"
        response2 = self.xblock5.student_submit(answer)
        self.assertEqual(response2.json_body["result"], "success")
        id_xblock = str(self.xblock5.location).split('@')[-1]
        for id_question in ["q009", "q010", "q011"]:
            question = IterativeXBlockQuestion.objects.get(id_course=COURSE_ID, id_xblock=id_xblock, id_question=id_question)
            self.assertEqual(question.id_question, id_question)
            self.assertEqual(IterativeXBlockAnswer.objects.filter(question=question, id_course=COURSE_ID).count(), 1)
            answer = IterativeXBlockAnswer.objects.get(question=question, id_course=COURSE_ID, id_student="101")
            self.assertEqual(answer.id_course, COURSE_ID)
            self.assertEqual(answer.id_student, "101")
            self.assertEqual(answer.answer, json.loads(dataanswer)[id_question])
        

    def test_student_answer_and_display(self):
        """
        Checks if a student's answer is saved successfully and then displayed in another XBlock referring this answer.
        """
        request = TestRequest()
        request.method = 'POST'
        sample_content = {
            "n_rows": 2,
            "1": {
                "n_cells": 2,
                "1": {
                    "type": "question",
                    "content": "q012"
                },
                "2": {
                    "type": "text",
                    "content": "TestText2"
                }
            },
            "2": {
                "n_cells": 3,
                "1": {
                    "type": "text",
                    "content": "TestText3"
                },
                "2": {
                    "type": "question",
                    "content": "q013"
                },
                "3": {
                    "type": "question",
                    "content": "q014"
                }
            }
        }
        data = json.dumps({
            "content": sample_content,
            "title": self.xblock6.title,
            "style": self.xblock6.style,
            "gridlines": self.xblock6.gridlines,
            "no_answer_message": self.xblock6.no_answer_message,
            "submit_message": self.xblock6.submit_message,
            "submitted_message": self.xblock6.submitted_message,
            "display_message": self.xblock6.display_message,
            "min_questions": self.xblock6.min_questions,
            "enable_download": self.xblock6.enable_download,
            "new_questions": ["q012", "q013", "q014"],
            "removed_questions": []
        })
        request.body = data.encode('utf-8')
        response = self.xblock6.studio_submit(request)
        self.assertEqual(response.json_body["result"], "success")
        request2 = TestRequest()
        request2.method = 'POST'
        sample_content2 = {
            "n_rows": 1,
            "1": {
                "n_cells": 2,
                "1": {
                    "type": "answer",
                    "content": "q012"
                },
                "2": {
                    "type": "question",
                    "content": "q015"
                }
            }
        }
        data2 = json.dumps({
            "content": sample_content2,
            "title": self.xblock7.title,
            "style": self.xblock7.style,
            "gridlines": self.xblock7.gridlines,
            "no_answer_message": self.xblock7.no_answer_message,
            "submit_message": self.xblock7.submit_message,
            "submitted_message": self.xblock7.submitted_message,
            "display_message": self.xblock7.display_message,
            "min_questions": self.xblock7.min_questions,
            "enable_download": self.xblock7.enable_download,
            "new_questions": ["q015"],
            "removed_questions": []
        })
        request2.body = data2.encode('utf-8')
        response2 = self.xblock7.studio_submit(request2)
        self.assertEqual(response2.json_body["result"], "success")
        answer = TestRequest()
        answer.method = 'POST'
        dataanswer = json.dumps({
            "q012": "First response",
            "q013": "Second response",
            "q014": "Third response"
        })
        answer.body = dataanswer.encode('utf-8')
        self.xblock6.scope_ids.user_id = "102"
        response3 = self.xblock6.student_submit(answer)
        self.assertEqual(response3.json_body["result"], "success")
        display = TestRequest()
        display.method = 'POST'
        display.body = json.dumps({
            "id_question": "q012"
        }).encode('utf-8')
        self.xblock7.scope_ids.user_id = "102"
        response4 = self.xblock7.fetch_previous_submission(display)
        self.assertEqual(response4.json_body["result"], "success")
        self.assertEqual(response4.json_body["answer"], "First response")
        self.assertIsNotNone(response4.json_body["answer_time"])


    def test_clear_student_state(self):
        """
        Checks if a student's answer is saved successfully and then cleared.
        """
        request = TestRequest()
        request.method = 'POST'
        sample_content = {
            "n_rows": 1,
            "1": {
                "n_cells": 2,
                "1": {
                    "type": "question",
                    "content": "q016"
                },
                "2": {
                    "type": "question",
                    "content": "q017"
                }
            }
        }
        data = json.dumps({
            "content": sample_content,
            "title": self.xblock8.title,
            "style": self.xblock8.style,
            "gridlines": self.xblock8.gridlines,
            "no_answer_message": self.xblock8.no_answer_message,
            "submit_message": self.xblock8.submit_message,
            "submitted_message": self.xblock8.submitted_message,
            "display_message": self.xblock8.display_message,
            "min_questions": self.xblock8.min_questions,
            "enable_download": self.xblock8.enable_download,
            "new_questions": ["q016", "q017"],
            "removed_questions": []
        })
        request.body = data.encode('utf-8')
        response = self.xblock8.studio_submit(request)
        self.assertEqual(response.json_body["result"], "success")
        answer = TestRequest()
        answer.method = 'POST'
        dataanswer = json.dumps({
            "q016": "First response",
            "q017": "Second response"
        })
        answer.body = dataanswer.encode('utf-8')
        previous_user_id = self.xblock8.scope_ids.user_id
        self.xblock8.scope_ids.user_id = "test"
        id_xblock = str(self.xblock8.location).split('@')[-1]
        response2 = self.xblock8.student_submit(answer)
        self.assertEqual(response2.json_body["result"], "success")
        for id_question in ["q016", "q017"]:
            question = IterativeXBlockQuestion.objects.get(id_course=COURSE_ID, id_xblock=id_xblock, id_question=id_question)
            self.assertEqual(question.id_question, id_question)
            self.assertEqual(IterativeXBlockAnswer.objects.filter(question=question, id_course=COURSE_ID).count(), 1)
            answer = IterativeXBlockAnswer.objects.get(question=question, id_course=COURSE_ID, id_student="test")
            self.assertEqual(answer.answer, json.loads(dataanswer)[id_question])
        self.xblock8.scope_ids.user_id = previous_user_id
        self.xblock8.clear_student_state("test", COURSE_ID, None, None)
        for id_question in ["q016", "q017"]:
            question = IterativeXBlockQuestion.objects.get(id_course=COURSE_ID, id_xblock=id_xblock, id_question=id_question)
            self.assertEqual(question.id_question, id_question)
            self.assertEqual(IterativeXBlockAnswer.objects.filter(question=question, id_course=COURSE_ID).count(), 0)


    # def test_duplicate(self):
    #     #Duplicar el Xblock
    #     self.assertEqual(IAAActivity.objects.all().count(), 0)
    #     activity = IAAActivity.objects.create(id_course=COURSE_ID, activity_name='TestActivity')
    #     stage = IAAStage.objects.create(activity=activity, stage_label='TestStageLabel1', stage_number='1')
    #     fake_xblock =  Mock(
    #         stage_number = stage.stage_number,
    #         activity_name = activity.activity_name,
    #         block_type = 'full'
    #     )
    #     duplicated = self.xblock5.studio_post_duplicate("", fake_xblock)
    #     self.assertEqual(duplicated, True)
    #     item = IAAActivity.objects.last()
    #     random = item.id + 1
    #     activity_name = 'TestActivity_copy{}'.format(random)
    #     self.assertTrue(IAAActivity.objects.filter(activity_name=activity_name).exists())

