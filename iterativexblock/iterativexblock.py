import json
import pkg_resources
from xblock.core import XBlock
from django.template.context import Context
from xblock.fields import Integer, String, Scope, Boolean, Float, Dict
from xblockutils.resources import ResourceLoader
from xblock.fragment import Fragment
import datetime

loader = ResourceLoader(__name__)

_ = lambda text: text

@XBlock.needs('i18n')
class IterativeXBlock(XBlock):
    """
    This XBlock allows to create open response activities whose user answers
    can be later retrieved at other instances of this XBlock.
    """

    display_name = String(
        display_name=_("Display Name"),
        help=_("Display name for this module"),
        default="Iterative XBlock",
        scope=Scope.settings,
    )

    configured = Boolean(
        default=False,
        scope=Scope.settings,
        help="Wether this XBlock has been set up or not."
    )

    title = String(
        default="Iterative XBlock",
        scope=Scope.settings,
        help="Title of this activity."
    )

    style = String(
        default="base",
        values=["base", "redfid"],
        scope=Scope.settings,
        help="Style of this block."
    )

    n_columns = Integer(
        default=1,
        scope=Scope.settings,
        help="Number of columns of this activity."
    )

    no_answer_message = String(
        default="You have not answered this question yet.",
        scope=Scope.settings,
        help="Message to be shown to the user when a question has not been answered yet."
    )

    enable_download = Boolean(
        default=False,
        scope=Scope.settings,
        help="Wether to shown the download buttons or not."
    )

    force_all_answers = Boolean(
        default=False,
        scope=Scope.settings,
        help="Wether to shown the download buttons or not."
    )

    content = Dict(
        default={},
        scope=Scope.settings,
        help="Content of this XBlock: texts, questions and references."
    )

    score = Float(
        default=0.0,
        scope=Scope.user_state,
    )

    has_author_view = True

    has_score = True


    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")


    def build_fragment(
        self,
        rendered_template,
        initialize_js_func,
        additional_css=[],
        additional_js=[],
        settings={}
    ):
        """
        Creates a fragment for display.
        """
        fragment = Fragment(rendered_template)
        for item in additional_css:
            url = self.runtime.local_resource_url(self, item)
            fragment.add_css_url(url)
        for item in additional_js:
            url = self.runtime.local_resource_url(self, item)
            fragment.add_javascript_url(url)
        settings = settings
        fragment.initialize_js(initialize_js_func, json_args=settings)
        return fragment
    

    def clear_student_state(self, user_id, course_id, item_id, requesting_user_id):
        from .models import IterativeXBlockQuestion, IterativeXBlockAnswer
        from common.djangoapps.student.models import user_by_anonymous_id

        id_student = user_by_anonymous_id(user_id).id
        for id_question in get_questions(self.content):
            question = IterativeXBlockQuestion.objects.get(id_course=self.course_id, id_xblock=self.scope_ids.usage_id, id_question=id_question)
            answers = IterativeXBlockAnswer.objects.filter(question=question, id_student=id_student)
            for answer in answers:
                answer.delete()


    def studio_post_duplicate(self, store, source_item):
        #pendiente
        from .models import IAAActivity, IAAStage
        if source_item.block_type == "full":
            item = IAAActivity.objects.last()
            random = item.id + 1
            new_name = source_item.activity_name + "_copy{}".format(str(random + 1))
            self.activity_name = new_name
            self.activity_stage = "1"
            new_activity = IAAActivity.objects.create(id_course=self.course_id, activity_name=self.activity_name)
            new_stage = IAAStage.objects.create(activity=new_activity, stage_label=self.stage_label, stage_number=self.activity_stage)
        return True


    def student_view(self, context={}):
        from .models import IterativeXBlockQuestion, IterativeXBlockAnswer
        from django.contrib.auth.models import User

        if getattr(self.runtime, 'user_is_staff', False):
            return self.instructor_view(self, context)
        else:
            return self.learner_view(self, context)


    def learner_view(self, context={}):
        id_student = self.scope_ids.user_id
        context.update(
            {
                "title": self.title
            }
        )
        template = loader.render_django_template(
            'public/html/iterativexblock_student.html',
            context=Context(context),
            i18n_service=self.runtime.service(self, 'i18n'),
        )
        frag = self.build_fragment(
            template,
            initialize_js_func='IterativeAssessedActivityStudent',
            additional_css=[
                'public/css/iterativexblock_{}.css'.format(self.style),
            ],
            additional_js=[
                'public/js/iterativexblock_student.js',
            ],
            settings={
                "location": str(self.location).split('@')[-1],
                "user_id": id_student,
                "title": self.title, 
            }
        )
        return frag
    

    def instructor_view(self, context={}):
        id_student = self.scope_ids.user_id
        context.update(
            {
                "title": self.title
            }
        )
        template = loader.render_django_template(
            'public/html/iterativexblock_student.html',
            context=Context(context),
            i18n_service=self.runtime.service(self, 'i18n'),
        )
        frag = self.build_fragment(
            template,
            initialize_js_func='IterativeAssessedActivityStudent',
            additional_css=[
                'public/css/iterativexblock_{}.css'.format(self.style),
            ],
            additional_js=[
                'public/js/iterativexblock_student.js',
            ],
            settings={
                "location": str(self.location).split('@')[-1],
                "user_id": id_student,
                "title": self.title, 
            }
        )
        return frag


    def studio_view(self, context):
        from .models import IAAActivity, IAAStage
        id_course = self.course_id
        js_context = {
            "title": self.title
        }
        context.update(
            {
                "context": json.dumps(js_context)
            }
        )
        template = loader.render_django_template(
            'public/html/iterativexblock_studio.html',
            context=Context(context),
            i18n_service=self.runtime.service(self, 'i18n'),
        )
        frag = self.build_fragment(
            template,
            initialize_js_func='IterativeAssessedActivityStudio',
            additional_js=[
                'public/js/iterativexblock_studio.js',
            ],
        )
        return frag


    def author_view(self, context={}):
        indicator_class = self.get_indicator_class()
        if self.block_type == "none":
            js_context = {
                "block_type": self.block_type,
                "title": self.title
            }
        elif self.block_type == "full":
            from .models import IAAActivity, IAAStage
            id_course = self.course_id
            activity = IAAActivity.objects.filter(id_course=id_course, activity_name=self.activity_name).first()
            stages_list = [[x["stage_number"], x["stage_label"]] for x in IAAStage.objects.filter(activity=activity).order_by("stage_number").values("stage_number", "stage_label")]
            js_context = {
                "title": self.title,
                "activity_name": self.activity_name,
                "block_type": self.block_type,
                "activity_stage": self.activity_stage,
                "stage_label": self.stage_label,
                "question": self.question,
                "min_length": self.min_length,
                "stages": stages_list,
                "activity_previous": self.activity_previous,
                'location': str(self.location).split('@')[-1],
                'indicator_class': indicator_class,
            }
            if self.activity_previous:
                try:
                    previous_activity = IAAActivity.objects.filter(id_course=id_course, activity_name=self.activity_name_previous).first()
                    previous_stage = IAAStage.objects.get(activity=previous_activity, stage_number=self.activity_stage_previous)
                    stage_label_previous = previous_stage.stage_label
                    js_context["activity_name_previous"] = self.activity_name_previous
                    js_context["activity_stage_previous"] = self.activity_stage_previous
                    js_context["stage_label_previous"] = stage_label_previous
                except:
                    js_context["activity_name_previous"] = "ERROR"
                    js_context["activity_stage_previous"] = "ERROR"
                    js_context["stage_label_previous"] = "ERROR"
        elif self.block_type == "display":
            from .models import IAAActivity, IAAStage
            id_course = self.course_id
            js_context = {
                "title": self.title,
                "block_type": self.block_type,
                'location': str(self.location).split('@')[-1],
                'indicator_class': indicator_class,
            }
            try:
                previous_activity = IAAActivity.objects.filter(id_course=id_course, activity_name=self.activity_name_previous).first()
                previous_stage = IAAStage.objects.get(activity=previous_activity, stage_number=self.activity_stage_previous)
                stage_label_previous = previous_stage.stage_label
                js_context["activity_name_previous"] = self.activity_name_previous
                js_context["activity_stage_previous"] = self.activity_stage_previous
                js_context["stage_label_previous"] = stage_label_previous
            except:
                js_context["activity_name_previous"] = "ERROR"
                js_context["activity_stage_previous"] = "ERROR"
                js_context["stage_label_previous"] = "ERROR"
        elif self.block_type == "summary":
            js_context = {
                "title": self.title,
                "activity_name": self.activity_name,
                "block_type": self.block_type,
                "summary_text": self.summary_text,
                "summary_list": self.summary_list,
                'location': str(self.location).split('@')[-1],
            }
        else:
            js_context = {
                "title": self.title,
                "block_type": self.block_type,
                'location': str(self.location).split('@')[-1]
            }
        template = loader.render_django_template(
            'public/html/iterativexblock_author.html',
            context=Context(js_context),
            i18n_service=self.runtime.service(self, 'i18n'),
        )
        frag = self.build_fragment(
            template,
            initialize_js_func='IterativeAssessedActivityAuthor',
            additional_css=[
                'public/css/iterativexblock.css',
            ],
            additional_js=[
                'public/js/iterativexblock_author.js',
            ],
        )
        return frag
    

    @XBlock.json_handler
    def studio_submit(self, data, suffix=''):
        """
        Called when submitting the form in Studio.
        """
        from .models import IterativeXBlockQuestion, IterativeXBlockAnswer

        id_course = self.course_id
        id_student = self.scope_ids.user_id
        self.content = data.get('content')
        # agregar filtro por id_xblock distinto a este mismo
        existing_question_ids = [x.id_question for x in IterativeXBlockQuestion.objects.filter(id_course=id_course).all()]
        new_question_ids = [x.id_question for x in self.content.values()]
        if bool(set(new_question_ids) & set(existing_question_ids)):
            self.content = {}
            return {'result': 'failed', 'error': 102}
        if not self.configured:
            for question in self.content.values():
                if question.id_question is not None:
                    # agregar id_xblock igual a este mismo
                    new_question = IterativeXBlockQuestion(id_course=id_course, id_xblock=2, id_question=question.id_question)
                    new_question.save()
            self.configured = True
        else:
            new_questions = list(set(new_question_ids) - set(existing_question_ids))
            deleted_questions = list(set(existing_question_ids) - set(new_question_ids))
            for question in new_questions:
                # agregar id_xblock igual a este mismo
                new_question = IterativeXBlockQuestion(id_course=id_course, id_xblock=2, id_question=question.id_question)
                new_question.save()
            for question in deleted_questions:
                # agregar id_xblock igual a este mismo
                deleted_question = IterativeXBlockQuestion.objects.get(id_course=id_course, id_xblock=2, id_question=question.id_question)
                deleted_answers = IterativeXBlockAnswer.objects.filter(id_course=id_course, question=deleted_question).all()
                for answer in deleted_answers:
                    answer.delete()
                deleted_question.delete()
        self.title = data.get('title')
        self.style = data.get('style')
        self.n_columns = data.get('n_columns')
        self.no_answer_message = data.get('no_answer_message')
        self.enable_download = data.get('enable_download')
        self.force_all_answers = data.get('force_all_answers')
        return {'result': 'success'}


    @XBlock.json_handler
    def student_submit(self, data, suffix=''):
        """
        """
        from .models import IAAActivity, IAAStage, IAASubmission

        id_course = self.course_id
        id_student = self.scope_ids.user_id
        if self.score != 0.0:
            return {"result": 'repeated', "indicator_class": self.get_indicator_class()}
        else:
            self.score = 1
            self.runtime.publish(
                self,
                'grade',
                {
                    'value': 1,
                    'max_value': 1
                }
            )
            current_activity = IAAActivity.objects.get(id_course=id_course, activity_name=self.activity_name)
            current_stage = IAAStage.objects.get(activity=current_activity, stage_number=self.activity_stage)
            new_submission_time = datetime.datetime.now()
            new_submission = IAASubmission(stage=current_stage, id_student=id_student, submission=data["submission"], submission_time=new_submission_time)
            new_submission.save()
            return {"result": 'success', "indicator_class": self.get_indicator_class()}

    
    @XBlock.json_handler
    def fetch_previous_submission(self, data, suffix=''):
        """
        """
        from .models import IAAActivity, IAAStage, IAASubmission

        id_course = self.course_id
        id_student = self.scope_ids.user_id
        current_activity_previous = IAAActivity.objects.get(id_course=id_course, activity_name=self.activity_name_previous)
        current_stage_previous = IAAStage.objects.get(activity=current_activity_previous, stage_number=self.activity_stage_previous)
        current_submission_previous = IAASubmission.objects.filter(stage=current_stage_previous, id_student=id_student).values("submission", "submission_time")
        try:
            current_activity_previous = IAAActivity.objects.get(id_course=id_course, activity_name=self.activity_name_previous)
            current_stage_previous = IAAStage.objects.get(activity=current_activity_previous, stage_number=self.activity_stage_previous)
            stage_label_previous = current_stage_previous.stage_label
            current_submission_previous = IAASubmission.objects.filter(stage=current_stage_previous, id_student=id_student).values("submission", "submission_time")
            if len(current_submission_previous) == 0:
                this_submission_previous = "EMPTY"
                this_submission_time_previous = "EMPTY"
            else:
                this_submission_previous = current_submission_previous[0]["submission"].replace("&", "&amp;").replace(">", "&gt;").replace("<", "&lt;")
                this_submission_time_previous = str(current_submission_previous[0]["submission_time"])
        except:
            this_submission_previous = "ERROR"
            this_submission_time_previous = "ERROR"
            stage_label_previous = "ERROR"
        return {"result": 'success', 'submission_previous': this_submission_previous, 'submission_previous_time': this_submission_time_previous, "stage_label_previous": stage_label_previous, "indicator_class": self.get_indicator_class()}


    @XBlock.json_handler
    def fetch_summary(self, data, suffix=''):
        """
        """
        from .models import IAAActivity, IAAStage, IAASubmission
        from django.contrib.auth.models import User

        enrolled = User.objects.filter(courseenrollment__course_id=self.course_id,courseenrollment__is_active=1).order_by('id').values('id' ,'first_name', 'last_name', 'email')
        id_course = self.course_id
        if data["user_id"] == "self":
            id_student = self.scope_ids.user_id
        else:
            id_student = data["user_id"]
        name = None
        for x in enrolled:
            if x["id"] == id_student:
                name = x["first_name"] + " " + x["last_name"]
                break
        try:
            current_activity = IAAActivity.objects.get(id_course=id_course, activity_name=self.activity_name)
            summary = []
            stages_list = IAAStage.objects.filter(activity=current_activity).order_by("stage_number").all()
            for stage in stages_list:
                if stage.stage_number in self.summary_list.split(","):
                    submission = IAASubmission.objects.filter(stage=stage, id_student=id_student).values("submission", "submission_time")
                    if len(submission) == 0:
                        this_summary_submission = "No se registra respuesta."
                        this_summary_submission_time = "—"
                    else:
                        this_summary_submission = submission[0]["submission"].replace("&", "&amp;").replace(">", "&gt;").replace("<", "&lt;")
                        this_summary_submission_time = str(submission[0]["submission_time"])
                    summary.append((stage.stage_number, stage.stage_label, this_summary_submission, this_summary_submission_time))
            return {"result": "success", "summary": summary, "indicator_class": self.get_indicator_class(), "name": name, "is_summary": self.block_type == "summary"}
        except:
            return {"result": "failed", "indicator_class": self.get_indicator_class()}


    @XBlock.json_handler
    def instructor_submit(self, data, suffix=''):
        """
        """
        from .models import IAAActivity, IAAStage, IAAFeedback
        id_course = self.course_id
        id_instructor = self.scope_ids.user_id
        current_activity = IAAActivity.objects.get(id_course=id_course, activity_name=self.activity_name)
        current_stage = IAAStage.objects.get(activity=current_activity)
        id_student = data.get("id_student")
        feedback = data.get("feedback")
        new_feedback_time = datetime.datetime.now()
        existing_feedback = IAAFeedback.objects.filter(stage=current_stage, id_instructor=id_instructor, id_student=id_student).all()
        if len(existing_feedback) == 0:
            new_feedback = IAAFeedback(stage=current_stage, id_instructor=id_instructor, id_student=id_student, feedback=feedback, feedback_time=new_feedback_time)
            new_feedback.save()
        else:
            existing_feedback = IAAFeedback.objects.get(stage=current_stage, id_instructor=id_instructor, id_student=id_student)
            existing_feedback.feedback = feedback
            existing_feedback.feedback_time = new_feedback_time
            existing_feedback.save()
        return {"result": "success"}


    def get_indicator_class(self):
        indicator_class = 'unanswered'
        if self.score != 0:
            indicator_class = 'correct'
        return indicator_class


    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("IterativeAssessedActivityXBlock",
             """<iterativexblock/>
             """)
        ]

