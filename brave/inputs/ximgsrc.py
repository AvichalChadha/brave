from brave.inputs.input import Input
import brave.config as config


class ImageInput(Input):
    '''
    Handles an image input.
    Freezes the image to create a video stream.
    '''

    def has_audio(self):
        return False

    def permitted_props(self):
        return {
            **super().permitted_props(),
            'uri': {
                'type': 'str',
            },
            'width': {
                'type': 'int'
            },
            'height': {
                'type': 'int'
            }
        }

    def create_elements(self):
        if not config.enable_video():
            return

        # To crop (not resize): videobox autocrop=true border-alpha=0

        pipeline_string = (f'uridecodebin name=uridecodebin uri="self.uri" ! '
                           'imagefreeze ! videoconvert ! video/x-raw,pixel-aspect-ratio=1/1,framerate=30/1 ! '
                           f'{self.default_video_pipeline_string_end()}')

        pipeline_string = (f'ximagesrc xid=0x03800014 startx=0 use-damage=0 ! '
                           'imagefreeze ! videoconvert ! video/x-raw,pixel-aspect-ratio=1/1,framerate=30/1 ! '
                           f'{self.default_video_pipeline_string_end()}')

        self.create_pipeline_from_string(pipeline_string)
        self.final_video_tee = self.pipeline.get_by_name('final_video_tee')
        self.uridecodebin = self.pipeline.get_by_name('uridecodebin')

    def get_input_cap_props(self):
        '''
        Gets the width/height of the input.
        '''

        element = self.uridecodebin
        if not element:
            return
        pad = element.get_static_pad('src_0')
        if not pad:
            return
        caps = pad.get_current_caps()
        if not caps:
            return
        size = caps.get_size()
        if size == 0:
            return

        structure = caps.get_structure(0)
        props = {'video_caps_string': structure.to_string()}
        if structure.has_field('height'):
            props['height'] = structure.get_int('height').value
        if structure.has_field('width'):
            props['width'] = structure.get_int('width').value

        return props

# pipeline
gst-launch-1.0 $SRC2

  video/x-raw,framerate=30/1  ! queue ! videoconvert ! videorate ! videoscale method=1

  ! queue !

  x264enc

  ! queue !

  flvmux name=mux !

  ! queue !



  videoconvert ! x264enc bitrate=2000 tune=zerolatency ! video/x-h264 ! h264parse ! \

  queue !

  rtmpsink location=$RTMP_DEST  \

  pulsesrc device=$asrc ! audioconvert ! audioresample ! \

  audio/x-raw,rate=48000 ! \

  voaacenc bitrate=96000 ! audio/mpeg ! aacparse ! audio/mpeg, mpegversion=4 ! mux. \

SRC2=" ximagesrc xid=0x03800014 startx=0 use-damage=0 "
