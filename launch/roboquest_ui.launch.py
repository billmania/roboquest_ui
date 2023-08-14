import os

from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node
from ament_index_python.packages import get_package_share_directory


def generate_launch_description():

    use_sim_time = LaunchConfiguration('use_sim_time', default='false')

    share_directory = get_package_share_directory('roboquest_ui')
    start_js_file = os.path.join(
        share_directory,
        'dist',
        'rq_server.js')

    rq_server_node = Node(
        name='rq_server',
        executable='node',
        output='screen',
        emulate_tty=True,
        parameters=[{'use_sim_time': use_sim_time}],
        arguments=[
            start_js_file
        ],
        cwd=share_directory)

    ld = LaunchDescription()
    ld.add_action(rq_server_node)

    return ld
