cmake_minimum_required(VERSION 3.5)
project(roboquest_ui)

find_package(ament_cmake REQUIRED)

if(BUILD_TESTING)
  find_package(ament_lint_auto REQUIRED)
  ament_lint_auto_find_test_dependencies()
endif()

ament_package()

install(FILES 
  package.json
  DESTINATION share/${PROJECT_NAME}/
 )
 
 install(DIRECTORY 
  src/
  DESTINATION share/${PROJECT_NAME}/dist
  OPTIONAL
 )
 
 install(DIRECTORY 
  public/
  DESTINATION share/${PROJECT_NAME}/public
  OPTIONAL
 )
 
install(DIRECTORY 
  config
  dist
  public
  launch
  node_modules
  DESTINATION share/${PROJECT_NAME}/
  OPTIONAL
 )
