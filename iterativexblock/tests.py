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
        self.assertEqual(self.xblock1.configured, False)
        self.assertEqual(self.xblock1.submit_message, "Enviar")
        self.assertEqual(self.xblock1.content, {
            "grid": [
                ["" for i in range(10)] for j in range(10)
            ],
            "content": {}
        })


    def test_configure_text(self):
        """
        Checks if an XBlock gets configured successfully. Only text content is used.
        """
        request = TestRequest()
        request.method = 'POST'
        sample_content = {
            'grid': [
                ['a', 'a', 'b', '', '', '', '', '', '', ''], 
                ['c', 'c', 'b', '', '', '', '', '', '', ''], 
                ['c', 'c', 'z', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', '']
            ], 
            'content': {
                'cell_a': {
                    'type': 'text', 
                    'content': 'sadfasdfa', 
                    'metadata': {
                        'placeholder': '', 
                        'min_chars': '0', 
                        'min_words': '0', 
                        'required': 'required'
                    },
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_b': {
                    'type': 'text', 
                    'content': 'vdfvxszfv', 
                    'metadata': {
                        'placeholder': '', 
                        'min_chars': '0', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_c': {
                    'type': 'text', 
                    'content': 'sadfasdfgsda', 
                    'metadata': {
                        'placeholder': '', 
                        'min_chars': '0', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_z': {
                    'type': 'text', 
                    'content': 'asfw4qef43wqfwaefe', 
                    'metadata': {
                        'placeholder': '', 
                        'min_chars': '0', 
                        'min_words': '0',
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }
            }
        }
        data = json.dumps({
            "content": sample_content,
            "title": self.xblock1.title,
            "submit_message": self.xblock1.submit_message,
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
            'grid': [
                ['a', 'a', 'b', '', '', '', '', '', '', ''], 
                ['c', 'c', 'c', '', '', '', '', '', '', ''], 
                ['c', 'c', 'c', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', '']
            ], 
            'content': {
                'cell_a': {
                    'type': 'question', 
                    'content': 'q001', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_b': {
                    'type': 'question', 
                    'content': 'q002', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_c': {
                    'type': 'question', 
                    'content': 'q003', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }
            }
        }
        data = json.dumps({
            "content": sample_content,
            "title": self.xblock2.title,
            "submit_message": self.xblock2.submit_message,
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
            'grid': [
                ['a', 'a', 'b', '', '', '', '', '', '', ''], 
                ['c', 'c', 'c', '', '', '', '', '', '', ''], 
                ['c', 'c', 'c', '', '', '', '', '', '', ''], 
                ['d', 'e', 'e', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', '']
            ], 
            'content': {
                'cell_a': {
                    'type': 'question', 
                    'content': 'q004', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_b': {
                    'type': 'question', 
                    'content': 'q005', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_c': {
                    'type': 'answer', 
                    'content': 'q001', 
                    'metadata': {
                        'placeholder': 'Ver respuesta', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_d': {
                    'type': 'answer', 
                    'content': 'q002', 
                    'metadata': {
                        'placeholder': 'Ver respuesta', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_e': {
                    'type': 'answer', 
                    'content': 'q003', 
                    'metadata': {
                        'placeholder': 'Ver respuesta', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }
            }
        }
        data = json.dumps({
            "content": sample_content,
            "title": self.xblock3.title,
            "submit_message": self.xblock3.submit_message,
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
            'grid': [
                ['a', 'a', 'b', '', '', '', '', '', '', ''], 
                ['c', 'c', 'c', '', '', '', '', '', '', ''], 
                ['c', 'c', 'c', '', '', '', '', '', '', ''], 
                ['d', 'd', 'd', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', '']
            ], 
            'content': {
                'cell_a': {
                    'type': 'question', 
                    'content': 'q006', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_b': {
                    'type': 'question', 
                    'content': 'q007', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_c': {
                    'type': 'answer', 
                    'content': 'q001', 
                    'metadata': {
                        'placeholder': 'Ver respuesta', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_d': {
                    'type': 'text', 
                    'content': 'Test text', 
                    'metadata': {
                        'placeholder': '', 
                        'min_chars': '0', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }
            }
        }
        data = json.dumps({
            "content": sample_content,
            "title": "Some other title",
            "submit_message": "Custom submit message",
            "new_questions": ["q006", "q007"],
            "removed_questions": []
        })
        request.body = data.encode('utf-8')
        response = self.xblock4.studio_submit(request)
        id_xblock = str(self.xblock4.location).split('@')[-1]
        self.assertEqual(response.json_body["result"], "success")
        self.assertEqual(self.xblock4.title, "Some other title")
        self.assertEqual(self.xblock4.submit_message, "Custom submit message")
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
            'grid': [
                ['a', 'a', 'b', '', '', '', '', '', '', ''], 
                ['c', 'c', 'c', '', '', '', '', '', '', ''], 
                ['c', 'c', 'c', '', '', '', '', '', '', ''], 
                ['d', 'd', 'd', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', '']
            ], 
            'content': {
                'cell_a': {
                    'type': 'question', 
                    'content': 'q006', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_b': {
                    'type': 'question', 
                    'content': 'q008', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_c': {
                    'type': 'answer', 
                    'content': 'q001', 
                    'metadata': {
                        'placeholder': 'Ver respuesta', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_d': {
                    'type': 'text', 
                    'content': 'Test text', 
                    'metadata': {
                        'placeholder': '', 
                        'min_chars': '0', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }
            }
        }
        data2 = json.dumps({
            "content": sample_content2,
            "title": self.xblock4.title,
            "submit_message": self.xblock4.submit_message,
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
            'grid': [
                ['a', 'a', 'b', '', '', '', '', '', '', ''], 
                ['c', 'c', 'c', '', '', '', '', '', '', ''], 
                ['c', 'c', 'c', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', '']
            ], 
            'content': {
                'cell_a': {
                    'type': 'question', 
                    'content': 'q009', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_b': {
                    'type': 'question', 
                    'content': 'q010', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_c': {
                    'type': 'question', 
                    'content': 'q011', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }
            }
        }
        data = json.dumps({
            "content": sample_content,
            "title": self.xblock5.title,
            "submit_message": self.xblock5.submit_message,
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
            'grid': [
                ['a', 'a', 'b', '', '', '', '', '', '', ''], 
                ['c', 'c', 'c', '', '', '', '', '', '', ''], 
                ['c', 'c', 'c', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', '']
            ], 
            'content': {
                'cell_a': {
                    'type': 'question', 
                    'content': 'q012', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_b': {
                    'type': 'question', 
                    'content': 'q013', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_c': {
                    'type': 'question', 
                    'content': 'q014', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }
            }
        }
        data = json.dumps({
            "content": sample_content,
            "title": self.xblock6.title,
            "submit_message": self.xblock6.submit_message,
            "new_questions": ["q012", "q013", "q014"],
            "removed_questions": []
        })
        request.body = data.encode('utf-8')
        response = self.xblock6.studio_submit(request)
        self.assertEqual(response.json_body["result"], "success")
        request2 = TestRequest()
        request2.method = 'POST'
        sample_content2 = {
            'grid': [
                ['a', 'a', 'b', '', '', '', '', '', '', ''], 
                ['c', 'c', 'c', '', '', '', '', '', '', ''], 
                ['c', 'c', 'c', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', '']
            ], 
            'content': {
                'cell_a': {
                    'type': 'question', 
                    'content': 'q015', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_b': {
                    'type': 'answer', 
                    'content': 'q013', 
                    'metadata': {
                        'placeholder': 'Ver respuesta', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }
            }
        }
        data2 = json.dumps({
            "content": sample_content2,
            "title": self.xblock7.title,
            "submit_message": self.xblock7.submit_message,
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
            "id_question": "q012",
            "id_user": ""
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
            'grid': [
                ['a', 'a', 'b', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', '']
            ], 
            'content': {
                'cell_a': {
                    'type': 'question', 
                    'content': 'q016', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_b': {
                    'type': 'question', 
                    'content': 'q017', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }
            }
        }
        data = json.dumps({
            "content": sample_content,
            "title": self.xblock8.title,
            "submit_message": self.xblock8.submit_message,
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


    def test_duplicate(self):
        sample_content = {
            'grid': [
                ['a', 'a', 'b', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', ''], 
                ['', '', '', '', '', '', '', '', '', '']
            ], 
            'content': {
                'cell_a': {
                    'type': 'question', 
                    'content': 'q018', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }, 
                'cell_b': {
                    'type': 'question', 
                    'content': 'q019', 
                    'metadata': {
                        'placeholder': 'Placeholder', 
                        'min_chars': '20', 
                        'min_words': '0', 
                        'required': 'required'
                    }, 
                    'format': {
                        'bold': False, 
                        'italic': False, 
                        'underline': False, 
                        'strike': False, 
                        'horizontal_align': 'justify', 
                        'vertical_align': 'middle', 
                        'border_left': False, 
                        'border_top': False, 
                        'border_right': False, 
                        'border_bottom': False, 
                        'border_bold': False
                    }
                }
            }
        }
        fake_xblock =  Mock(
            content=sample_content,
            title='TestTitle',
            style='TestStyle',
            no_answer_message='TestNoAnswerMessage',
            submit_message='TestSubmitMessage',
            display_message='TestDisplayMessage',
            min_questions=1,
            enable_download=True
        )
        duplicated = self.xblock9.studio_post_duplicate("", fake_xblock)
        self.assertTrue(duplicated)
        questions = IterativeXBlockQuestion.objects.filter(id_course=COURSE_ID, id_xblock=str(self.xblock9.location).split('@')[-1])
        self.assertEqual(questions.count(), 2)
        for question in ["q018", "q019"]:
            self.assertTrue(questions.filter(id_question=question+"_1").exists())

